/**
 * KnowledgeDialog.tsx
 *
 * 챗봇 지식 편집 다이얼로그. (지식/지식 후보/피드백/갭 리포트 공용)
 * 제목/분류/본문/스코프를 편집하고 승인(verified)·폐기(rejected)·재검증·삭제를 처리한다.
 * 편집과 버튼은 교육자에게만 활성화되며, 그 외 계정은 읽기 전용으로 표시한다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import { Autocomplete, ClearTextField, LabelSelect, TagsTextField, TextField } from "@ehfuse/mui-form-controls";
import {
    useChatbotConfig,
    useChatbotFormDialog,
    useChatbotNavigate,
    useChatbotSelectOptions,
} from "../../../ChatbotProvider";
import { mergeAutocompleteOptions } from "../../../internal/selectOptionAutocomplete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { ConfirmDialog, ErrorAlert } from "@ehfuse/alerts";
import { TrashIcon } from "../../../internal/icons";
import { chatbotManageApi } from "../../../apis/manageApi";
import { AnswerDraftDialog } from "./AnswerDraftDialog";
import { formatDateTime } from "../../../internal/dateUtils";
import type { useChatbotManageController } from "../../../controllers/manageController";
import type { KnowledgeRow, KnowledgeStatus } from "../../../types/manage";
import { ReasonChip, ScopeChip, StatusChip } from "../components/KnowledgeChips";

/** 지식 편집 다이얼로그 props 타입이다. */
interface KnowledgeDialogProps {
    controller: ReturnType<typeof useChatbotManageController>; // 챗봇 관리 컨트롤러
    isTrainer: boolean; // 교육자 여부(편집/버튼 활성)
    isHeadOffice: boolean; // 본사 로그인 여부(공용 스코프 선택 가능)
}

/** 이미지 위에 얹는 동작 버튼 스타일이다. (반투명 흰 배경 — 어떤 이미지 위에서도 아이콘이 보인다) */
const imageActionButtonSx = {
    width: 34,
    height: 34,
    bgcolor: "rgba(255, 255, 255, 0.92)",
    color: "#37352f",
    border: "1px solid #e5e7eb",
    "&:hover": { bgcolor: "#ffffff" },
} as const;

/** File 을 data URL 문자열로 읽는다. (AS 업로드 라우트가 data_url 을 받는다) */
function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
        reader.readAsDataURL(file);
    });
}

/** 스코프 목록에서 "공용(전체 가맹점)"을 나타내는 값이다. (가맹점 seq 와 겹치지 않게 0 을 쓴다) */
const SCOPE_SHARED_VALUE = 0;

/** 상태 전이 버튼의 라벨이다. (확인창 제목·확인버튼과 알림 문구에 함께 쓴다) */
const STATUS_ACTION_LABEL: Partial<Record<KnowledgeStatus, string>> = {
    verified: "승인",
    rejected: "폐기",
};

/** 첨부 이미지가 없을 때 뜨는 업로드 박스의 드래그 상태 표시용 인덱스다. (실제 이미지 인덱스와 겹치지 않게 -1) */
const EMPTY_DROP_ZONE_INDEX = -1;

/** 챗봇 지식 편집 다이얼로그 컴포넌트다. */
export function KnowledgeDialog({ controller, isTrainer, isHeadOffice }: KnowledgeDialogProps) {
    const { state, form, modals, deleteKnowledge, reverifyKnowledge } = controller;
    const navigate = useChatbotNavigate();
    // 출처 문의글 주소는 앱마다 다르므로 주입받는다(미주입이면 "문의글 열기" 를 감춘다).
    const { buildSourcePostUrl } = useChatbotConfig();
    // 다이얼로그 껍데기는 앱 공통 FormDialog(폰트 배율 등)를 주입받아 쓴다(미주입 시 mfd 기본).
    const FormDialog = useChatbotFormDialog();
    const seqRaw = form.useFormValue("seq") as number | undefined;
    const seq = Number(seqRaw) || 0;
    const statusRaw = form.useFormValue("status") as KnowledgeStatus | undefined;
    const status = statusRaw || "unverified";
    // 답변 생성에 넘길 값 — 제목은 실제 질문, 본문은 배경(이관 후보면 문제 서술)으로 쓴다.
    const draftTitle = (form.useFormValue("title") as string | undefined) ?? "";
    const draftSituation = (form.useFormValue("content") as string | undefined) ?? "";
    const scopeRaw = form.useFormValue("scope") as "shared" | "license" | undefined;
    const scope = scopeRaw || "shared";
    const mediaUuidsRaw = form.useFormValue("media_uuids") as string[] | undefined;
    const mediaUuids = mediaUuidsRaw || [];
    const dialogRowRaw = state.useValue("dialogRow") as KnowledgeRow | null | undefined;
    const dialogRow = dialogRowRaw || null;
    // 후보는 본문이 질문이라 그대로 승인하면 안 된다 — 본문을 답변으로 바꾼 뒤에야 승인을 연다.
    // 판정 기준 두 가지:
    //  ① 답변생성 기록(answer_drafted_time)이 이미 있다 — 지난번에 정리해 두고 저장만 한 경우도 열려야 한다.
    //  ② 이번에 본문을 고쳤다(답변생성 적용이든 직접 수정이든 불러온 본문과 달라졌다).
    const candidateAnswered =
        status === "candidate" &&
        (Boolean(dialogRow?.answer_drafted_time) ||
            draftSituation.trim() !== String(dialogRow?.content ?? "").trim());
    const saving = state.useValue("dialogSaving") === true;
    const readonly = !isTrainer;
    // 이미지 교체용 숨김 파일 입력과 교체 대상 인덱스(파일 선택 후 그 자리에 갈아끼운다).
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const replaceTargetIndexRef = useRef<number | null>(null);
    const [mediaBusy, setMediaBusy] = useState(false);
    // 클릭으로 선택된 이미지 인덱스 — 이 상태에서 Ctrl+V(클립보드 이미지)로 교체한다.
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    // 드래그 중인 이미지 인덱스 — 점선 드롭 안내 박스를 보여준다.
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    // 검색 태그 — 폼에는 쉼표 문자열로 저장하고, 입력칸에는 배열로 넘긴다.
    const tagsRaw = form.useFormValue("tags") as string | undefined;
    const tagList = useMemo(
        () =>
            String(tagsRaw ?? "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
        [tagsRaw]
    );
    /** 태그 입력 변경 — 저장 형태(쉼표 문자열)로 되돌린다. */
    const handleTagsChange = useCallback(
        (next: string[]) => {
            form.setFormValue("tags", next.join(","));
        },
        [form]
    );

    // 스코프 지정용 가맹점 목록 — 101 교육자가 다이얼로그를 처음 열 때 한 번만 불러온다.
    const [licenses, setLicenses] = useState<Array<{ seq: number; name: string }>>([]);
    useEffect(() => {
        if (!modals.knowledge.isOpen || !isHeadOffice || !isTrainer || licenses.length > 0) return;
        let alive = true;
        void chatbotManageApi
            .listScopeLicenses()
            .then((response) => {
                if (alive && response.ok && Array.isArray(response.items)) setLicenses(response.items);
            })
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, [modals.knowledge.isOpen, isHeadOffice, isTrainer, licenses.length]);

    // 스코프 선택 목록 — "공용" 1개 + 가맹점 전체를 한 목록에 나열한다(value 는 가맹점 seq).
    const licenseOptions = useMemo(
        () => licenses.map((license) => ({ value: license.seq, label: `${license.name} (${license.seq})` })),
        [licenses]
    );
    const scopeOptions = useMemo(
        () => [{ value: SCOPE_SHARED_VALUE, label: "공용 (전체 가맹점)" }, ...licenseOptions],
        [licenseOptions]
    );

    // 현재 선택된 대상 가맹점 seq (공용이면 목록에서 "공용" 항목이 선택된다).
    const targetLicenseSeqRaw = form.useFormValue("target_license_seq") as number | null | undefined;
    const targetLicenseSeq = targetLicenseSeqRaw ?? SCOPE_SHARED_VALUE;

    /** 스코프 선택 변경 — 고른 값에 따라 scope 와 target_license_seq 를 함께 맞춘다. */
    const handleScopeChange = useCallback(
        (event: { target: { value: unknown } }) => {
            const picked = Number(event.target.value);
            if (picked === SCOPE_SHARED_VALUE) {
                form.setFormValue("scope", "shared");
                form.setFormValue("target_license_seq", null);
                return;
            }
            form.setFormValue("scope", "license");
            form.setFormValue("target_license_seq", picked);
        },
        [form]
    );

    // 분류 자동완성 — select_options(chatbot_knowledge_category) 누적값 + 현재 입력값을 합친다. (FAQ 분류와 동일 패턴)
    const categoryValue = form.useFormValue("category") as string | undefined;
    const { values: categoryValues, renderOption: renderCategoryOption } =
        useChatbotSelectOptions("chatbot_knowledge_category");
    const categoryOptions = useMemo(
        () => mergeAutocompleteOptions(categoryValues, categoryValue),
        [categoryValues, categoryValue]
    );

    // 닫힘 애니메이션 이후 표시 원본을 정리한다. (폼 값은 다음 열기에서 setValues 로 덮인다)
    useEffect(() => {
        if (modals.knowledge.isOpen) return;
        setSelectedImageIndex(null);
        const timer = setTimeout(() => {
            state.setValue("dialogRow", null);
        }, 500);
        return () => clearTimeout(timer);
        // state 인스턴스는 전역 공유라 참조 고정 — 열림 상태 변화에만 반응한다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modals.knowledge.isOpen]);

    /** 상태를 지정한 뒤 저장한다. (승인/폐기/복구는 되돌리기 전에 한 번 확인받는다) */
    const handleSaveWithStatus = useCallback(
        async (nextStatus?: KnowledgeStatus) => {
            if (nextStatus) {
                // 상태 전이는 챗봇 답변 근거가 바뀌는 일이라 실수로 눌리지 않게 확인을 받는다.
                const confirmed = await ConfirmDialog({
                    title: STATUS_ACTION_LABEL[nextStatus] ?? "저장",
                    message:
                        nextStatus === "rejected"
                            ? "이 지식을 폐기하면 챗봇 답변에 더 이상 쓰이지 않습니다. 폐기할까요?"
                            : "이 지식을 승인하면 챗봇이 답변 근거로 사용합니다. 승인할까요?",
                    confirmText: STATUS_ACTION_LABEL[nextStatus] ?? "확인",
                    cancelText: "취소",
                });
                if (!confirmed) return;
                form.setFormValue("status", nextStatus);
            }
            await form.submit();
        },
        [form]
    );

    /** 첨부 이미지를 교체한다. 파일 선택창을 열고, 고른 파일을 그 자리에 바꿔 넣는다. */
    const handleReplaceImage = useCallback((imageIndex: number) => {
        replaceTargetIndexRef.current = imageIndex;
        imageInputRef.current?.click();
    }, []);

    /** 첨부 이미지가 없을 때 새로 추가한다. (빈 목록의 0번 자리에 넣는다) */
    const handleAddImage = useCallback(() => {
        if (mediaBusy) return;
        replaceTargetIndexRef.current = 0;
        imageInputRef.current?.click();
    }, [mediaBusy]);

    /** 답변 생성 다이얼로그를 연다 — 이전 입력/결과를 비우고 시작한다. */
    const handleOpenAnswerDraft = () => {
        state.setValue("answerDraftNotes", "");
        state.setValue("answerDraftResult", "");
        modals.answerDraft.open();
    };

    /** 생성된 안내문을 본문에 반영한다. (저장·승인은 교육자가 내용을 확인한 뒤 직접 누른다) */
    const handleApplyAnswerDraft = (draft: string) => {
        form.setFormValue("content", draft);
        // 저장 시 서버가 이 표시를 보고 작성자·일시를 찍는다(시각은 서버 시계를 쓴다).
        form.setFormValue("answer_drafted", true);
    };

    /** 첨부 이미지를 목록에서 뺀다. (저장 시 media_uuids 에서 빠진다 — 파일 자체는 GC 가 정리) */
    const handleRemoveImage = useCallback(
        (imageIndex: number) => {
            const current = (form.getFormValue("media_uuids") as string[] | undefined) ?? [];
            form.setFormValue(
                "media_uuids",
                current.filter((_uuid, index) => index !== imageIndex)
            );
            // 삭제로 인덱스가 밀리므로 Ctrl+V 대상 선택도 해제한다.
            setSelectedImageIndex(null);
        },
        [form]
    );

    /** 파일을 업로드해 지정 위치의 이미지를 갈아끼운다. (파일선택/드롭/붙여넣기 공용) */
    const replaceImageAt = useCallback(
        async (file: File | undefined, targetIndex: number | null) => {
            if (!file || targetIndex === null || mediaBusy) return;
            if (!file.type.startsWith("image/")) return;
            // 신규 지식(seq=0)은 앵커 레코드가 없어 업로드할 수 없다 — 먼저 저장해야 한다.
            if (seq <= 0) {
                ErrorAlert({ message: "지식을 먼저 저장한 뒤 이미지를 변경할 수 있습니다." });
                return;
            }
            setMediaBusy(true);
            try {
                const dataUrl = await readFileAsDataUrl(file);
                const response = await chatbotManageApi.uploadKnowledgeMedia({
                    entitySeq: seq,
                    fileName: file.name || "clipboard-image.png",
                    dataUrl,
                });
                if (!response.ok || !response.uuid) {
                    throw new Error(response.error || "이미지를 업로드할 수 없습니다.");
                }
                const current = (form.getFormValue("media_uuids") as string[] | undefined) ?? [];
                const next = [...current];
                next[targetIndex] = response.uuid;
                form.setFormValue("media_uuids", next);
            } catch (error) {
                ErrorAlert({
                    message: error instanceof Error ? error.message : "이미지를 업로드할 수 없습니다.",
                });
            } finally {
                setMediaBusy(false);
            }
        },
        [form, seq, mediaBusy]
    );

    /** 숨김 파일 입력에서 고른 파일로 교체 대상 인덱스 자리를 갈아끼운다. */
    const handleImageFileSelected = useCallback(
        (file: File | undefined) => {
            const targetIndex = replaceTargetIndexRef.current;
            replaceTargetIndexRef.current = null;
            void replaceImageAt(file, targetIndex);
        },
        [replaceImageAt]
    );

    // 이미지를 클릭해 선택한 상태에서 Ctrl+V 하면 클립보드 이미지로 교체한다.
    useEffect(() => {
        if (readonly || selectedImageIndex === null || !modals.knowledge.isOpen) return;
        const handlePaste = (event: ClipboardEvent) => {
            const target = event.target as HTMLElement | null;
            // 제목/본문 등 입력칸에 붙여넣는 중이면 가로채지 않는다.
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
                return;
            }
            const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.type.startsWith("image/"));
            const file = item?.getAsFile();
            if (!file) return;
            event.preventDefault();
            void replaceImageAt(file, selectedImageIndex);
        };
        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [readonly, selectedImageIndex, modals.knowledge.isOpen, replaceImageAt]);

    // 이미지 밖을 클릭하거나 다른 입력칸으로 포커스가 가면 선택을 해제한다.
    useEffect(() => {
        if (selectedImageIndex === null) return;
        const clearIfOutside = (event: Event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest?.("[data-knowledge-image]")) return;
            setSelectedImageIndex(null);
        };
        document.addEventListener("mousedown", clearIfOutside);
        document.addEventListener("focusin", clearIfOutside);
        return () => {
            document.removeEventListener("mousedown", clearIfOutside);
            document.removeEventListener("focusin", clearIfOutside);
        };
    }, [selectedImageIndex]);

    /** 현재 지식을 삭제한다. (FormDialog 내장 삭제 확인 후 호출된다) */
    const handleDelete = useCallback(async () => {
        if (seq > 0) await deleteKnowledge(seq);
    }, [seq, deleteKnowledge]);

    /** 현재 지식을 재검증한다. */
    const handleReverify = useCallback(async () => {
        if (seq > 0) await reverifyKnowledge(seq);
    }, [seq, reverifyKnowledge]);

    return (
        <>
        <FormDialog
            fontScaleKey="ChatbotKnowledgeDialog"
            backdropClick={false}
            open={modals.knowledge.isOpen}
            onClose={modals.knowledge.close}
            title={
                // 상태 칩을 제목 텍스트 옆에 간격을 두고 붙인다(본문 요약 행에서 올린다).
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
                    {seq ? "지식 편집" : "지식 등록"}
                    <StatusChip status={status} />
                </Box>
            }
            titleIcons={{ delete: { visible: false } }}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="md"
            sectionContentPaddingTop={0}
            onDelete={isTrainer && seq > 0 ? handleDelete : undefined}
            sections={[
                // 섹션을 1개로 합쳐 mfd 상단탭이 생기지 않게 한다.
                {
                    id: "knowledge-main",
                    showTitle: false,
                    children: (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {/* 승인 정보(왼쪽) + 스코프 토글(오른쪽) 2열 */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        flexWrap: "wrap",
                                        // 검증일·답변생성 문구가 길어지면 이쪽이 줄바꿈으로 흡수해야 한다.
                                        // (min-width:auto 로 두면 이 묶음이 안 줄어 오른쪽 스코프 select 가 대신 눌린다)
                                        flex: "1 1 auto",
                                        minWidth: 0,
                                    }}
                                >
                                    {/* 스코프를 못 고르는 계정에는 현재 스코프를 칩으로만 알린다. */}
                                    {readonly || !isHeadOffice ? (
                                        <ScopeChip
                                            targetLicenseSeq={
                                                scope === "shared"
                                                    ? null
                                                    : ((form.getFormValue("target_license_seq") as number | null) ??
                                                      null)
                                            }
                                            targetLicenseName={dialogRow?.target_license_name}
                                        />
                                    ) : null}
                                    {dialogRow?.status === "candidate" ? (
                                        <ReasonChip reason={dialogRow.candidate_reason} />
                                    ) : null}
                                    {/* 고객센터 이관 후보 — 출처 문의글을 문의게시판에서 바로 연다(양방향 연결). */}
                                    {buildSourcePostUrl && Number(dialogRow?.source_post_seq ?? 0) > 0 ? (
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                                navigate(buildSourcePostUrl(Number(dialogRow?.source_post_seq)))
                                            }
                                            sx={{ fontSize: "13.5px", fontWeight: 600, minWidth: 0, px: 0.75 }}
                                        >
                                            문의글 열기
                                        </Button>
                                    ) : null}
                                    {dialogRow ? (
                                        <Typography sx={{ color: "#111827" }}>
                                            👍 {Number(dialogRow.good_count) || 0} / 👎{" "}
                                            {Number(dialogRow.bad_count) || 0}
                                            {dialogRow.verified_time
                                                ? ` · 검증일 ${formatDateTime(dialogRow.verified_time)}`
                                                : ""}
                                            {/* 질문 본문을 답변으로 바꾼 사람·시각 — 누가 정리한 지식인지 추적한다. */}
                                            {dialogRow.answer_drafted_time
                                                ? ` · 답변생성 ${dialogRow.answer_drafted_by_name || "?"} ${formatDateTime(
                                                      dialogRow.answer_drafted_time
                                                  )}`
                                                : ""}
                                        </Typography>
                                    ) : null}
                                </Box>
                            </Box>

                            {/* 스코프(왼쪽) + 분류(오른쪽) 2열 — 둘 다 고르는 값이라 나란히 둔다.
                                스코프를 못 고르는 계정에는 분류만 남으므로 1열로 접는다(빈 칸을 만들지 않는다). */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: isHeadOffice && isTrainer ? "1fr 1fr" : "1fr",
                                    },
                                    gap: 2,
                                    alignItems: "center",
                                }}
                            >
                                {/* 101 로그인 교육자만 공용/가맹점 스코프를 선택할 수 있다. */}
                                {isHeadOffice && isTrainer ? (
                                    // 스코프는 하나의 목록으로 고른다 — "공용" + 가맹점 전체가 같은 목록에 나열된다.
                                    // (2단계로 "가맹점 지정"을 고른 뒤 다시 가맹점을 고르게 하지 않는다)
                                    <LabelSelect
                                        label="스코프"
                                        options={scopeOptions}
                                        value={scope === "shared" ? SCOPE_SHARED_VALUE : targetLicenseSeq}
                                        onChange={handleScopeChange}
                                        // 스코프는 항상 값이 있어야 한다 — "선택안함" 빈 항목을 없앤다.
                                        showEmptyOption={false}
                                        // 바깥 여백은 FormControl 쪽에 줘야 한다(sx 는 안쪽 Select 로 간다).
                                        // MUI FormControl 기본 오른쪽 여백(8px)을 없애 아래 제목칸 오른쪽 끝과 선을 맞춘다.
                                        formControlProps={{
                                            // 그리드 칸을 꽉 채운다 — 가맹점명이 길어도 잘리지 않는다.
                                            // MUI FormControl 기본 오른쪽 여백(8px)을 없애 아래 제목칸과 선을 맞춘다.
                                            sx: { width: "100%", marginRight: "0 !important" },
                                        }}
                                    />
                                ) : null}
                                <Autocomplete
                                    form={form}
                                    name="category"
                                    label="분류"
                                    options={categoryOptions}
                                    renderOption={renderCategoryOption}
                                    readonly={readonly}
                                    hideEmptyMessage
                                />
                            </Box>

                            {/* 제목은 길어서 한 행을 통째로 쓴다. */}
                            <ClearTextField form={form} name="title" label="제목" readonly={readonly} fullWidth />

                            {/* 검색용 태그 — 목록 검색이 제목 + 태그로 걸린다(본문은 색인하지 않는다).
                                지식 저장 시 자동 추출되며, 여기서 사람이 고칠 수 있다. */}
                            <TagsTextField
                                label="검색 태그"
                                value={tagList}
                                onChange={handleTagsChange}
                                readonly={readonly}
                                maxTags={6}
                                placeholder="검색에 쓸 말을 입력하고 Enter (예: 이용신청서, 빈소변경)"
                                fullWidth
                            />

                            {/* 본문 — 여러 줄 입력이라 지우기(✕) 버튼이 붙는 ClearTextField 대신 일반 TextField 를 쓴다.
                                maxRows 로 높이를 묶지 않는다 — 긴 본문이 입력칸 안에서만 스크롤되면 앞뒤를 같이 못 본다.
                                본문이 길면 그대로 늘어나고 다이얼로그(mfd)가 알아서 스크롤한다. */}
                            <TextField
                                form={form}
                                name="content"
                                label="본문"
                                readonly={readonly}
                                multiline
                                minRows={8}
                                fullWidth
                            />

                            {/* 첨부 이미지 (있을 때만) */}
                            {mediaUuids.length > 0 ? (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                    {mediaUuids.map((uuid, imageIndex) => (
                                        <Box
                                            key={uuid}
                                            // 바깥 클릭/포커스 이동 시 선택 해제 판정용 마커 속성이다.
                                            data-knowledge-image=""
                                            sx={{ position: "relative", alignSelf: "flex-start" }}
                                            // 클릭=선택(Ctrl+V 붙여넣기 대상), 다른 이미지 파일을 드롭하면 그 자리에서 교체된다.
                                            onClick={readonly ? undefined : () => setSelectedImageIndex(imageIndex)}
                                            onDragOver={
                                                readonly
                                                    ? undefined
                                                    : (event: React.DragEvent) => {
                                                          event.preventDefault();
                                                          setDragOverIndex(imageIndex);
                                                      }
                                            }
                                            onDragLeave={
                                                readonly
                                                    ? undefined
                                                    : (event: React.DragEvent) => {
                                                          // 자식(아이콘 버튼 등)으로 이동한 경우는 아직 영역 안이다.
                                                          if (
                                                              event.currentTarget.contains(
                                                                  event.relatedTarget as Node | null
                                                              )
                                                          ) {
                                                              return;
                                                          }
                                                          setDragOverIndex(null);
                                                      }
                                            }
                                            onDrop={
                                                readonly
                                                    ? undefined
                                                    : (event: React.DragEvent) => {
                                                          event.preventDefault();
                                                          setDragOverIndex(null);
                                                          setSelectedImageIndex(imageIndex);
                                                          void replaceImageAt(
                                                              event.dataTransfer.files?.[0],
                                                              imageIndex
                                                          );
                                                      }
                                            }
                                        >
                                            <Box
                                                component="img"
                                                src={`/api/v1/files/${uuid}`}
                                                alt="지식 첨부 이미지"
                                                sx={{
                                                    display: "block",
                                                    maxWidth: "100%",
                                                    borderRadius: 1,
                                                    border: "1px solid #e5e7eb",
                                                    ...(readonly ? {} : { cursor: "pointer" }),
                                                    // 선택된 이미지는 파란 외곽선으로 표시한다 (Ctrl+V 대상).
                                                    ...(selectedImageIndex === imageIndex
                                                        ? { outline: "2px solid #2563eb", outlineOffset: "-2px" }
                                                        : {}),
                                                }}
                                            />
                                            {/* 드래그 중 점선 드롭 안내 박스 — pointerEvents none 으로 dragleave 깜빡임을 막는다. */}
                                            {dragOverIndex === imageIndex ? (
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        border: "2px dashed #2563eb",
                                                        borderRadius: 1,
                                                        backgroundColor: "rgba(37, 99, 235, 0.08)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        pointerEvents: "none",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            px: 1.5,
                                                            py: 0.5,
                                                            borderRadius: "8px",
                                                            backgroundColor: "rgba(255, 255, 255, 0.92)",
                                                            fontSize: "13.5px",
                                                            fontWeight: 600,
                                                            color: "#2563eb",
                                                        }}
                                                    >
                                                        놓으면 이 이미지가 교체됩니다
                                                    </Box>
                                                </Box>
                                            ) : null}
                                            {/* 교육자만 이미지를 바꾸거나 지울 수 있다 — 이미지 우상단에 아이콘으로 얹는다. */}
                                            {readonly ? null : (
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        top: 12,
                                                        right: 12,
                                                        display: "flex",
                                                        gap: 1,
                                                    }}
                                                >
                                                    <Tooltip title="이미지 교체">
                                                        <IconButton
                                                            onClick={() => handleReplaceImage(imageIndex)}
                                                            disabled={mediaBusy}
                                                            sx={imageActionButtonSx}
                                                        >
                                                            <EditOutlinedIcon sx={{ fontSize: 20 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="이미지 삭제">
                                                        <IconButton
                                                            onClick={() => handleRemoveImage(imageIndex)}
                                                            disabled={mediaBusy}
                                                            sx={imageActionButtonSx}
                                                        >
                                                            <TrashIcon sx={{ fontSize: 20 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            ) : readonly ? null : (
                                /* 첨부 이미지가 없을 때 — 눌러서 고르거나 파일을 끌어다 놓는 업로드 박스. */
                                <Box
                                    onClick={() => handleAddImage()}
                                    onDragOver={(event: React.DragEvent) => {
                                        event.preventDefault();
                                        setDragOverIndex(EMPTY_DROP_ZONE_INDEX);
                                    }}
                                    onDragLeave={(event: React.DragEvent) => {
                                        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                                        setDragOverIndex(null);
                                    }}
                                    onDrop={(event: React.DragEvent) => {
                                        event.preventDefault();
                                        setDragOverIndex(null);
                                        void replaceImageAt(event.dataTransfer.files?.[0], 0);
                                    }}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 1,
                                        py: 4,
                                        borderRadius: 1,
                                        cursor: mediaBusy ? "default" : "pointer",
                                        border: "1px dashed",
                                        // 드래그가 올라오면 테두리·배경으로 놓을 자리를 알린다.
                                        borderColor: dragOverIndex === EMPTY_DROP_ZONE_INDEX ? "#2f80ed" : "#d1d5db",
                                        bgcolor: dragOverIndex === EMPTY_DROP_ZONE_INDEX ? "#eff6ff" : "transparent",
                                        color: "#6b7280",
                                        "&:hover": { borderColor: "#9ca3af" },
                                    }}
                                >
                                    {mediaBusy ? (
                                        <CircularProgress size={22} />
                                    ) : (
                                        <ImageOutlinedIcon sx={{ fontSize: 28, color: "#9ca3af" }} />
                                    )}
                                    <Box sx={{ fontSize: "13.5px", color: "#374151" }}>
                                        이미지를 끌어다 놓거나 클릭해서 첨부하세요
                                    </Box>
                                </Box>
                            )}

                            {/* 이미지 교체용 숨김 파일 입력 — 교체 아이콘이 이 입력을 대신 연다. */}
                            <Box
                                component="input"
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                sx={{ display: "none" }}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    void handleImageFileSelected(event.target.files?.[0]);
                                    // 같은 파일을 다시 골라도 change 가 뜨도록 값을 비운다.
                                    event.target.value = "";
                                }}
                            />
                        </Box>
                    ),
                },
            ]}
            actions={{
                visible: true,
                right: isTrainer ? (
                    <>
                        {seq > 0 && status === "verified" ? (
                            <Button variant="outlined" onClick={handleReverify} disabled={saving}>
                                재검증
                            </Button>
                        ) : null}
                        {/* 이미 폐기된 지식에는 폐기 버튼을 두지 않는다(같은 상태로 다시 바꿀 일이 없다).
                            신규 등록에도 두지 않는다 — 아직 없는 지식을 폐기·승인할 일은 없다(저장이 곧 등록이다). */}
                        {seq > 0 && status !== "rejected" ? (
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => handleSaveWithStatus("rejected")}
                                disabled={saving}
                            >
                                폐기
                            </Button>
                        ) : null}
                        {/* 후보는 본문이 질문(문제 서술)이라 그대로 승인하면 챗봇이 오답 근거로 쓴다.
                            승인 대신 답변 생성으로 보내 본문을 안내문으로 바꾸게 한다. */}
                        {status === "candidate" ? (
                            <Button variant="outlined" color="success" onClick={handleOpenAnswerDraft} disabled={saving}>
                                답변생성
                            </Button>
                        ) : null}
                        {/* 승인 지식에는 승인 버튼 대신 재검증만 둔다 — 승인→승인은 검증일만 갱신해 재검증과 겹친다.
                            폐기 지식에서는 이 버튼이 되살리는(복구) 역할을 한다. */}
                        {seq > 0 && status !== "verified" && (status !== "candidate" || candidateAnswered) ? (
                            <Button
                                variant="outlined"
                                color="success"
                                onClick={() => handleSaveWithStatus("verified")}
                                disabled={saving}
                            >
                                {status === "rejected" ? "복구" : "승인"}
                            </Button>
                        ) : null}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleSaveWithStatus()}
                            disabled={saving}
                            sx={{ minWidth: 80 }}
                        >
                            {saving ? <CircularProgress size={20} color="inherit" /> : "저장"}
                        </Button>
                    </>
                ) : (
                    <Button variant="contained" onClick={modals.knowledge.close}>
                        닫기
                    </Button>
                ),
            }}
        />
        {/* 답변 생성 — 후보의 질문 본문을 안내문으로 바꾸는 자리(확인해야 본문이 교체된다). */}
        <AnswerDraftDialog
            controller={controller}
            title={draftTitle}
            situation={draftSituation}
            onApply={handleApplyAnswerDraft}
        />
        </>
    );
}

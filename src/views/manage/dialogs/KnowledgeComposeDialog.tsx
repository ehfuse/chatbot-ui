/**
 * KnowledgeComposeDialog.tsx
 *
 * 지식 등록 전 단계 — 자유서술을 받아 지식 한 건으로 정리해 보여주는 창이다.
 *
 * 교육자는 마크다운을 모르는 현장 담당자다. 등록 폼에 제목·분류·본문을 직접 채우게 하면
 * 형식이 제각각이고 본문이 평문 줄글로 들어가 화면에서 읽기 어려워진다.
 * 그래서 "무엇을 알려주고 싶은지"만 적게 하고, **지식 미리보기** 로 정리 결과를 확인한 뒤
 * **확인** 을 눌러야 등록 폼이 채워진 채로 열린다(여기서 바로 저장되지는 않는다).
 */

import { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { TextField } from "@ehfuse/mui-form-controls";
import { ErrorAlert } from "@ehfuse/alerts";
import { chatbotManageApi } from "../../../apis/manageApi";
import { MarkdownContent } from "../../components/MarkdownContent";
import { useChatbotFormDialog } from "../../../ChatbotProvider";
import type { KnowledgeCreatePrefill } from "../../../controllers/manageController";

/** 자유서술 정리 창 props 다. */
export interface KnowledgeComposeDialogProps {
    open: boolean; // 열림 여부
    onClose: () => void; // 닫기(취소 포함)
    onConfirm: (prefill: KnowledgeCreatePrefill) => void; // 확인 — 정리 결과로 등록 폼을 연다
}

/** 안내 문구 — 무엇을 적어야 하는지 예시로 보여준다. */
const PLACEHOLDER =
    "알려주고 싶은 내용을 편하게 적어 주세요. 문장을 다듬지 않으셔도 됩니다.\n\n" +
    "예) 빈소 재고를 다른 빈소로 옮기려면 재고관리에서 빈소재고관리로 들어가서 " +
    "옮길 상품의 실재고 숫자를 누르고 보낼 곳이랑 수량 정해서 저장하면 된다";

/** 자유서술을 지식 한 건으로 정리해 보여주는 창이다. */
export function KnowledgeComposeDialog({ open, onClose, onConfirm }: KnowledgeComposeDialogProps) {
    const FormDialog = useChatbotFormDialog();
    const [text, setText] = useState("");
    const [draft, setDraft] = useState<KnowledgeCreatePrefill | null>(null);
    const [loading, setLoading] = useState(false);

    // ⚠️ 여기서는 뒤로가기 닫기(useDialogBackClose)를 쓰지 않는다.
    // 확인을 누르면 이 창을 닫으면서 곧바로 등록 창을 여는데, 뒤로가기 닫기는 history.back() 으로 닫는다.
    // back 이 처리되기 전에 등록 창이 히스토리 칸을 쌓으면 그 칸이 대신 소비돼 등록 창이 열리자마자 닫힌다.
    // 이 창은 등록 흐름의 중간 단계라 취소/X 로만 닫으면 충분하다.

    // 닫힐 때 다음 등록을 위해 입력과 정리 결과를 비운다.
    useEffect(() => {
        if (open) return;
        const timer = setTimeout(() => {
            setText("");
            setDraft(null);
        }, 300);
        return () => clearTimeout(timer);
    }, [open]);

    /** 적은 내용을 지식 한 건(제목/분류/본문)으로 정리한다. */
    const handleCompose = useCallback(async () => {
        const source = text.trim();
        if (!source) {
            ErrorAlert({ message: "등록할 내용을 먼저 적어 주세요." });
            return;
        }
        setLoading(true);
        try {
            const res = await chatbotManageApi.composeKnowledge(source);
            if (!res?.draft?.content) throw new Error(res?.error || "내용을 정리하지 못했습니다.");
            setDraft(res.draft);
        } catch (error) {
            ErrorAlert({ message: error instanceof Error ? error.message : "내용을 정리하지 못했습니다." });
        } finally {
            setLoading(false);
        }
    }, [text]);

    /** 정리 결과로 등록 폼을 연다. (저장은 등록 폼에서 한 번 더 확인한다) */
    const handleConfirm = useCallback(() => {
        if (!draft) return;
        onConfirm(draft);
        onClose();
    }, [draft, onClose, onConfirm]);

    return (
        <FormDialog
            open={open}
            onClose={onClose}
            title="지식 등록"
            titleIcons={{ delete: { visible: false } }}
            tabs={{ visible: false }}
            locale="ko"
            maxWidth="lg"
            sectionContentPaddingTop={0}
            fontScaleKey="ChatbotKnowledgeComposeDialog"
            actions={{
                visible: true,
                right: (
                    <>
                        <Button variant="outlined" onClick={handleCompose} disabled={loading || !text.trim()}>
                            {loading ? <CircularProgress size={20} color="inherit" /> : "지식 미리보기"}
                        </Button>
                        <Button variant="contained" onClick={handleConfirm} disabled={!draft} sx={{ minWidth: 80 }}>
                            확인
                        </Button>
                    </>
                ),
            }}
            sections={[
                // 섹션을 1개로 합쳐 mfd 상단탭이 생기지 않게 한다.
                {
                    id: "knowledge-compose",
                    showTitle: false,
                    children: (
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    // 두 칸 사이 간격을 다이얼로그 본문 좌우 여백(24px)과 같게 둔다.
                    gap: 3,
                    minHeight: { xs: 420, md: 560 },
                }}
            >
                {/* 왼쪽 — 자유서술 입력 */}
                <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#111827", mb: 1 }}>
                        어떤 지식을 등록할까요?
                    </Typography>
                    <TextField
                        multiline
                        minRows={14}
                        placeholder={PLACEHOLDER}
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        sx={{ flex: 1, "& .MuiInputBase-root": { alignItems: "flex-start", height: "100%" } }}
                    />
                </Box>

                {/* 오른쪽 — 정리 결과 미리보기(실제 답변에 쓰이는 모양 그대로) */}
                <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#111827", mb: 1 }}>
                        지식 미리보기
                    </Typography>
                    <Box
                        sx={{
                            flex: 1,
                            p: 2,
                            border: "1px solid rgba(15, 23, 42, 0.15)",
                            borderRadius: "8px",
                            bgcolor: "#f8fafc",
                            overflow: "auto",
                        }}
                    >
                        {draft ? (
                            <>
                                <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                                    {draft.title}
                                </Typography>
                                {draft.category ? (
                                    <Typography sx={{ fontSize: "13.5px", color: "#4b5765", mt: 0.5 }}>
                                        분류: {draft.category}
                                    </Typography>
                                ) : null}
                                <Box
                                    sx={{
                                        mt: 1.5,
                                        pt: 1.5,
                                        borderTop: "1px solid rgba(15, 23, 42, 0.08)",
                                        fontSize: "1rem",
                                        color: "#111827",
                                    }}
                                >
                                    <MarkdownContent text={draft.content ?? ""} />
                                </Box>
                            </>
                        ) : (
                            // 왼쪽 입력칸 안내문과 같은 크기로 둔다(한쪽만 작으면 눈이 걸린다).
                            <Typography sx={{ fontSize: "1rem", lineHeight: 1.6, color: "#4b5765" }}>
                                왼쪽에 내용을 적고 <b>지식 미리보기</b> 를 누르시면, 챗봇이 쓸 형태로 정리한 결과가
                                여기에 보입니다. 마음에 들지 않으면 왼쪽 내용을 고쳐 다시 누르시면 됩니다.
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
                    ),
                },
            ]}
        />
    );
}

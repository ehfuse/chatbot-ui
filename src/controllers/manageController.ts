/**
 * manageController.ts
 *
 * 챗봇 관리 페이지 컨트롤러.
 * 전용 forma 상태(chatbotManageState)·지식 편집 폼·다이얼로그 모달·액션을 소유한다.
 * (기존 상담 드로어 상태 "chatbotState"/chatbotController 와는 완전히 분리되어 있다)
 * 파일 소유권 제약으로 manage 전용 초기값/액션도 이 파일에 함께 둔다.
 */
import { useGlobalForm, useGlobalFormaState, useModal, type ActionContext } from "@ehfuse/forma";
import { useChatbotConfig } from "../ChatbotProvider";
import { ErrorAlert, SuccessAlert } from "@ehfuse/alerts";
import { formatDate } from "../internal/dateUtils";
import { chatbotManageApi } from "../apis/manageApi";
import type {
    ChatbotManageState,
    KnowledgeFilters,
    KnowledgeForm,
    KnowledgeRow,
} from "../types/manage";

/**
 * 다이얼로그 모달 제어다 (forma useModal 반환과 같은 모양).
 * forma 가 이 타입을 루트에서 내보내지 않아, 컨트롤러 반환 타입에 이름을 붙일 수 있게 여기서 다시 선언한다.
 */
export interface ChatbotModalControl {
    isOpen: boolean; // 열림 여부
    open: () => void; // 연다(히스토리 한 칸을 쌓는다)
    close: () => void; // 닫는다(쌓아둔 히스토리 칸을 되돌린다)
    toggle: () => void; // 열림/닫힘을 뒤집는다
    modalId: string; // 모달 식별자
}

/** 신규 등록 다이얼로그에 미리 채울 값이다(자유서술 정리 결과 등). */
export interface KnowledgeCreatePrefill {
    title?: string; // 제목
    category?: string; // 분류
    content?: string; // 본문(마크다운)
}

/** 지식 분류 자동완성 옵션 타입 키다(앱의 select_options 종류 이름). */
export const KNOWLEDGE_CATEGORY_OPTION_TYPE = "chatbot_knowledge_category";

/** unknown 오류에서 사용자 표시용 메시지를 추출한다. */
function toErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

/** 오늘 기준 n개월 전 날짜를 YYYY-MM-DD 로 반환한다. (taskbox monthsAgoDate 와 동일 계산) */
function monthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return formatDate(date);
}

/** 챗봇 관리 상태 초기값을 생성한다. (분석 기간 기본 최근 3개월) */
function createInitialManageState(): ChatbotManageState {
    return {
        tab: 0,
        knowledgeItems: [],
        knowledgeTotal: 0,
        knowledgeTabCount: 0,
        candidateTabCount: 0,
        feedbackTabCount: 0,
        knowledgeLoading: false,
        knowledgeLoadingMore: false,
        knowledgePage: 1,
        knowledgeHasMore: false,
        knowledgeFilters: {
            status: "",
            category: "",
            scope: "",
            stale: false,
            search: "",
            sort: "updated_time",
            sortDir: "DESC",
        },
        duplicateGroups: [],
        duplicateChecking: false,
        duplicateOnly: false,
        candidateItems: [],
        candidateLoading: false,
        feedbackItems: [],
        feedbackLoading: false,
        feedbackRating: "bad",
        statsFrom: monthsAgo(3),
        statsTo: formatDate(new Date()),
        statsLicenseSeq: "",
        stats: null,
        usageFrom: monthsAgo(3),
        usageTo: formatDate(new Date()),
        usageLicenseSeq: "",
        usage: null,
        usageLoading: false,
        answerDraftNotes: "",
        answerDraftResult: "",
        answerDraftLoading: false,
        statsLoading: false,
        gapItems: [],
        dialogMode: "edit",
        dialogRow: null,
        dialogSaving: false,
    };
}

/** 저장 결과 알림 문구다. (상태 전이는 "저장"이 아니라 한 일로 알린다) */
const SAVE_RESULT_MESSAGE: Partial<Record<string, string>> = {
    rejected: "지식을 폐기했습니다.",
    verified: "지식을 승인했습니다.",
};

/** 지식 편집 폼 초기값이다. */
const defaultKnowledgeFormValues: KnowledgeForm = {
    seq: 0,
    title: "",
    category: "",
    content: "",
    status: "unverified",
    scope: "shared",
    target_license_seq: null,
    media_uuids: [],
    tags: "",
    answer_drafted: false,
};

// ==================== 상태 액션 (ActionContext<ChatbotManageState>) ====================

/** 지식 목록 한 페이지 크기다. (첫 로딩·추가 로딩 공통) */
const KNOWLEDGE_PAGE_SIZE = 50;

/** 지식 목록을 현재 필터 기준으로 첫 페이지부터 다시 조회한다. (필터/검색 변경 시) */
const loadKnowledge = () => async (context: ActionContext<ChatbotManageState>) => {
    context.setValue("knowledgeLoading", true);
    try {
        const filters = context.getValue("knowledgeFilters") as KnowledgeFilters;
        const response = await chatbotManageApi.listKnowledge({
            status: filters.status || undefined,
            category: filters.category || undefined,
            scope: filters.scope || undefined,
            search: filters.search,
            stale: filters.stale,
            // 상태 "전체" 에서는 후보를 서버가 빼준다 — 프런트에서 자르면 페이지가 50건보다 적어진다.
            excludeCandidate: !filters.status,
            sort: filters.sort,
            sortDir: filters.sortDir,
            page: 1,
            limit: KNOWLEDGE_PAGE_SIZE,
        });
        const items = Array.isArray(response.items) ? response.items : [];
        const total = typeof response.total === "number" ? response.total : items.length;
        context.setValue("knowledgeItems", items);
        context.setValue("knowledgeTotal", total);
        context.setValue("knowledgePage", 1);
        // 받은 건수가 페이지 크기에 못 미치면 그것으로 끝이다(total 을 못 믿는 경우까지 방어).
        context.setValue("knowledgeHasMore", items.length >= KNOWLEDGE_PAGE_SIZE && items.length < total);
    } catch (error) {
        context.setValue("knowledgeItems", []);
        context.setValue("knowledgeTotal", 0);
        context.setValue("knowledgePage", 1);
        context.setValue("knowledgeHasMore", false);
        ErrorAlert({ message: toErrorMessage(error, "지식 목록을 불러올 수 없습니다.") });
    } finally {
        context.setValue("knowledgeLoading", false);
    }
};

/** 지식 목록 다음 페이지를 이어서 불러와 누적한다. (무한스크롤) */
const loadMoreKnowledge = () => async (context: ActionContext<ChatbotManageState>) => {
    // 첫 조회 중이거나 이미 추가 로딩 중이거나 남은 페이지가 없으면 무시한다(중복 요청 방지).
    if (context.getValue("knowledgeLoading") === true) return;
    if (context.getValue("knowledgeLoadingMore") === true) return;
    if (context.getValue("knowledgeHasMore") !== true) return;

    context.setValue("knowledgeLoadingMore", true);
    const nextPage = (Number(context.getValue("knowledgePage")) || 1) + 1;
    try {
        const filters = context.getValue("knowledgeFilters") as KnowledgeFilters;
        const response = await chatbotManageApi.listKnowledge({
            status: filters.status || undefined,
            category: filters.category || undefined,
            scope: filters.scope || undefined,
            search: filters.search,
            stale: filters.stale,
            excludeCandidate: !filters.status,
            sort: filters.sort,
            sortDir: filters.sortDir,
            page: nextPage,
            limit: KNOWLEDGE_PAGE_SIZE,
        });
        const fetched = Array.isArray(response.items) ? response.items : [];
        const current = (context.getValue("knowledgeItems") as KnowledgeRow[]) || [];
        // 조회 사이에 지식이 추가/수정되면 정렬(updated_time DESC)이 밀려 같은 행이 다시 올 수 있다.
        const seen = new Set(current.map((row) => row.seq));
        const merged = [...current, ...fetched.filter((row) => !seen.has(row.seq))];
        const total = typeof response.total === "number" ? response.total : merged.length;
        context.setValue("knowledgeItems", merged);
        context.setValue("knowledgeTotal", total);
        context.setValue("knowledgePage", nextPage);
        context.setValue("knowledgeHasMore", fetched.length >= KNOWLEDGE_PAGE_SIZE && merged.length < total);
    } catch (error) {
        // 추가 로딩 실패는 목록을 비우지 않는다 — 이미 보고 있던 페이지는 그대로 두고 재시도만 막는다.
        context.setValue("knowledgeHasMore", false);
        ErrorAlert({ message: toErrorMessage(error, "지식 목록을 더 불러올 수 없습니다.") });
    } finally {
        context.setValue("knowledgeLoadingMore", false);
    }
};

/** 탭 배지용 건수만 모두 조회한다. (목록은 채우지 않는다 — 각 탭을 열 때 따로 불러온다) */
const loadTabCounts = () => async (context: ActionContext<ChatbotManageState>) => {
    // 지식: 폐기·후보를 뺀 전체 건수(필터와 무관한 고정 수치)
    const knowledge = chatbotManageApi
        .listKnowledge({ excludeCandidate: true, page: 1, limit: 1 })
        .then((res) => context.setValue("knowledgeTabCount", Number(res.total) || 0))
        .catch(() => undefined);
    // 후보: status=candidate 전체 건수
    const candidate = chatbotManageApi
        .listKnowledge({ status: "candidate", page: 1, limit: 1 })
        .then((res) => context.setValue("candidateTabCount", Number(res.total) || 0))
        .catch(() => undefined);
    // 피드백: 목록 라우트가 total 을 주지 않아 받은 건수로 센다(상한 200).
    const feedback = chatbotManageApi
        .listFeedback({})
        .then((res) => context.setValue("feedbackTabCount", Array.isArray(res.items) ? res.items.length : 0))
        .catch(() => undefined);
    await Promise.all([knowledge, candidate, feedback]);
};

/** 지식 후보(status=candidate) 목록을 조회한다. */
const loadCandidates = () => async (context: ActionContext<ChatbotManageState>) => {
    context.setValue("candidateLoading", true);
    try {
        const response = await chatbotManageApi.listKnowledge({ status: "candidate" });
        context.setValue("candidateItems", Array.isArray(response.items) ? response.items : []);
    } catch (error) {
        context.setValue("candidateItems", []);
        ErrorAlert({ message: toErrorMessage(error, "지식 후보 목록을 불러올 수 없습니다.") });
    } finally {
        context.setValue("candidateLoading", false);
    }
};

/** 답변 피드백 목록을 현재 평가 필터 기준으로 조회한다. */
const loadFeedback = () => async (context: ActionContext<ChatbotManageState>) => {
    context.setValue("feedbackLoading", true);
    try {
        const rating = context.getValue("feedbackRating") as "all" | "good" | "bad";
        const response = await chatbotManageApi.listFeedback({
            rating: rating === "all" ? undefined : rating,
        });
        context.setValue("feedbackItems", Array.isArray(response.items) ? response.items : []);
    } catch (error) {
        context.setValue("feedbackItems", []);
        ErrorAlert({ message: toErrorMessage(error, "답변 피드백을 불러올 수 없습니다.") });
    } finally {
        context.setValue("feedbackLoading", false);
    }
};

/** 분석 탭 데이터(통계 + 지식 갭 리포트)를 조회한다. */
const loadAnalytics = () => async (context: ActionContext<ChatbotManageState>) => {
    context.setValue("statsLoading", true);
    try {
        const from = context.getValue("statsFrom") as string;
        const to = context.getValue("statsTo") as string;
        // 검색어는 가맹점명이다 — 서버(resolveLicenseFilter)가 이름 LIKE 로 seq 를 해석한다.
        const licenseName = String(context.getValue("statsLicenseSeq") ?? "").trim();
        const [statsResponse, gapsResponse] = await Promise.all([
            chatbotManageApi.getStats({ from, to, licenseName: licenseName || undefined }),
            chatbotManageApi.listGaps({ licenseName: licenseName || undefined }),
        ]);
        context.setValue("stats", statsResponse.stats ?? null);
        context.setValue("gapItems", Array.isArray(gapsResponse.items) ? gapsResponse.items : []);
    } catch (error) {
        context.setValue("stats", null);
        context.setValue("gapItems", []);
        ErrorAlert({ message: toErrorMessage(error, "챗봇 통계를 불러올 수 없습니다.") });
    } finally {
        context.setValue("statsLoading", false);
    }
};

/** 교육자 메모로 지식 본문 초안을 생성한다. (확인 전까지 본문에 반영하지 않는다) */
const generateAnswerDraft =
    () =>
    async (context: ActionContext<ChatbotManageState>, params: { title: string; situation: string }) => {
        const notes = String(context.getValue("answerDraftNotes") ?? "").trim();
        if (!notes) {
            ErrorAlert({ message: "해결 방법을 먼저 입력해 주세요." });
            return;
        }
        context.setValue("answerDraftLoading", true);
        try {
            const response = await chatbotManageApi.draftAnswer({
                title: params.title,
                situation: params.situation,
                notes,
            });
            context.setValue("answerDraftResult", String(response.draft ?? ""));
        } catch (error) {
            ErrorAlert({ message: toErrorMessage(error, "답변 초안을 만들지 못했습니다.") });
        } finally {
            context.setValue("answerDraftLoading", false);
        }
    };

/** 사용현황(계정별 질문·교육·토큰·예상금액)을 조회한다. */
const loadUsage = () => async (context: ActionContext<ChatbotManageState>) => {
    context.setValue("usageLoading", true);
    try {
        const from = context.getValue("usageFrom") as string;
        const to = context.getValue("usageTo") as string;
        // 검색어는 가맹점명이다 — 서버(resolveLicenseFilter)가 이름 LIKE 로 seq 를 해석한다.
        const licenseName = String(context.getValue("usageLicenseSeq") ?? "").trim();
        const response = await chatbotManageApi.getUsage({ from, to, licenseName: licenseName || undefined });
        context.setValue("usage", response.usage ?? null);
    } catch (error) {
        context.setValue("usage", null);
        ErrorAlert({ message: toErrorMessage(error, "사용현황을 불러올 수 없습니다.") });
    } finally {
        context.setValue("usageLoading", false);
    }
};

/** 중복 검사를 실행해 중복 의심 지식 seq 목록을 갱신한다. */
/** 중복 그룹만 다시 계산한다. (승인/폐기 후 정리된 그룹을 목록에서 걷어내기 위함) */
const refreshDuplicateGroups = () => async (context: ActionContext<ChatbotManageState>) => {
    try {
        const response = await chatbotManageApi.listDuplicates();
        const groups = Array.isArray(response.groups) ? response.groups : [];
        context.setValue("duplicateGroups", groups);
        // 정리가 끝나 남은 그룹이 없으면 스위치를 내려 일반 목록으로 되돌린다.
        if (groups.length === 0) context.setValue("duplicateOnly", false);
    } catch {
        // 재계산 실패는 조용히 넘긴다 — 저장 자체는 이미 성공했다.
    }
};

/** "중복의심" 스위치를 토글한다. 켤 때 중복 그룹을 조회하고, 끄면 일반 목록으로 돌아간다. */
const toggleDuplicateOnly = () => async (context: ActionContext<ChatbotManageState>, next: boolean) => {
    context.setValue("duplicateOnly", next);
    if (!next) return;
    context.setValue("duplicateChecking", true);
    try {
        const response = await chatbotManageApi.listDuplicates();
        const groups = Array.isArray(response.groups) ? response.groups : [];
        context.setValue("duplicateGroups", groups);
        if (groups.length === 0) {
            SuccessAlert({ message: "중복 의심 지식이 없습니다." });
            // 볼 것이 없으면 스위치를 자동으로 되돌려 빈 화면을 남기지 않는다.
            context.setValue("duplicateOnly", false);
        }
    } catch (error) {
        context.setValue("duplicateGroups", []);
        context.setValue("duplicateOnly", false);
        ErrorAlert({ message: toErrorMessage(error, "중복 검사에 실패했습니다.") });
    } finally {
        context.setValue("duplicateChecking", false);
    }
}

/** 지식 탭 필터를 부분 갱신한다. (leaf 경로로 저장해 하위 구독자에게 확실히 알림, 조회는 호출부에서 loadKnowledge 실행) */
const setKnowledgeFilters = () => (context: ActionContext<ChatbotManageState>, partial: Partial<KnowledgeFilters>) => {
    for (const [key, value] of Object.entries(partial)) {
        context.setValue(`knowledgeFilters.${key}`, value);
    }
};

// ==================== 컨트롤러 ====================

/** 지식 행을 편집 폼 값으로 변환한다. */
function toKnowledgeForm(row: KnowledgeRow): KnowledgeForm {
    return {
        seq: Number(row.seq) || 0,
        title: row.title ?? "",
        category: row.category ?? "",
        content: row.content ?? "",
        status: row.status ?? "unverified",
        scope: row.target_license_seq == null ? "shared" : "license",
        target_license_seq: row.target_license_seq == null ? null : Number(row.target_license_seq),
        media_uuids: Array.isArray(row.media_uuids) ? [...row.media_uuids] : [],
        tags: String(row.tags ?? ""),
        // 다른 지식을 열 때 이전 편집의 반영 표시가 남지 않게 항상 끈다.
        answer_drafted: false,
    };
}

/** 챗봇 관리 페이지 상태/폼/모달을 통합 관리하는 컨트롤러 훅이다. */
export function useChatbotManageController() {
    // Modal 정의 (지식 편집 다이얼로그)
    const modals: { knowledge: ChatbotModalControl; answerDraft: ChatbotModalControl } = {
        knowledge: useModal({ modalId: "chatbot-knowledge-dialog" }),
        answerDraft: useModal({ modalId: "chatbot-answer-draft-dialog" }),
    };

    // 전역 상태 (기존 "chatbotState" 와 분리된 관리 전용 stateId)
    const state = useGlobalFormaState<ChatbotManageState>({
        stateId: "chatbotManageState",
        initialValues: createInitialManageState(),
        actions: {
            loadKnowledge: loadKnowledge(),
            loadTabCounts: loadTabCounts(),
            loadMoreKnowledge: loadMoreKnowledge(),
            loadCandidates: loadCandidates(),
            loadFeedback: loadFeedback(),
            loadAnalytics: loadAnalytics(),
            loadUsage: loadUsage(),
            generateAnswerDraft: generateAnswerDraft(),
            toggleDuplicateOnly: toggleDuplicateOnly(),
            refreshDuplicateGroups: refreshDuplicateGroups(),
            setKnowledgeFilters: setKnowledgeFilters(),
        },
    });

    /** 지식 저장 후 현재 화면 데이터(목록/후보)를 재조회한다. */
    const reloadAfterChange = async () => {
        // 탭 배지 숫자도 함께 맞춘다 — 승인/폐기/삭제로 "폐기 제외" 건수가 달라진다.
        await Promise.all([
            state.actions.loadKnowledge(),
            state.actions.loadCandidates(),
            state.actions.loadTabCounts(),
            // 중복의심 모드면 그룹도 다시 계산한다 — 둘 중 하나를 폐기하면 그 그룹은 더 이상 중복이 아니다.
            state.getValue("duplicateOnly") === true ? state.actions.refreshDuplicateGroups() : Promise.resolve(),
        ]);
    };

    // 저장한 분류를 같은 세션에서 바로 자동완성에 띄우기 위한 알림 콜백이다(서버는 저장 경로에서 upsert).
    // 옵션 목록의 원본은 앱이 가지고 있으므로, 패키지는 "새 값이 생겼다"만 알리고 반영은 앱이 한다.
    const { onSelectOptionAdded } = useChatbotConfig();

    /** 저장한 분류를 소비처에 알린다(자동완성 후보 낙관적 반영용). */
    const patchCategoryOption = (category: string | undefined | null): void => {
        const value = String(category ?? "").trim();
        if (!value) return;
        onSelectOptionAdded?.(KNOWLEDGE_CATEGORY_OPTION_TYPE, value);
    };

    // 지식 편집 폼
    const form = useGlobalForm<KnowledgeForm>({
        formId: "chatbot-knowledge-form",
        initialValues: defaultKnowledgeFormValues,
        onValidate: (values) => {
            if (!values.title.trim()) {
                ErrorAlert({ message: "제목을 입력하세요." });
                return false;
            }
            if (!values.content.trim()) {
                ErrorAlert({ message: "본문을 입력하세요." });
                return false;
            }
            return true;
        },
        onSubmit: async (values) => {
            state.setValue("dialogSaving", true);
            try {
                await chatbotManageApi.saveKnowledge(Number(values.seq) || 0, {
                    title: values.title.trim(),
                    content: values.content,
                    category: values.category.trim(),
                    status: values.status,
                    target_license_seq: values.scope === "shared" ? null : values.target_license_seq,
                    media_uuids: values.media_uuids,
                    tags: values.tags,
                    answer_drafted: values.answer_drafted,
                });
                // 폐기/승인은 "저장"이 아니라 그 행위로 알린다(무엇을 했는지가 문구와 일치해야 한다).
                SuccessAlert({ message: SAVE_RESULT_MESSAGE[values.status] ?? "지식이 저장되었습니다.", delay: 500 });
                patchCategoryOption(values.category);
                modals.knowledge.close();
                await reloadAfterChange();
                return true;
            } catch (error) {
                ErrorAlert({ message: toErrorMessage(error, "지식 저장 중 오류가 발생했습니다.") });
                return false;
            } finally {
                state.setValue("dialogSaving", false);
            }
        },
    });

    /** 지식 행으로 편집 다이얼로그를 연다. (지식/후보/피드백 공용) */
    const openKnowledgeDialog = (row: KnowledgeRow) => {
        state.setValue("dialogMode", "edit");
        state.setValue("dialogRow", row);
        form.setFormValues(toKnowledgeForm(row));
        modals.knowledge.open();
    };

    /** 지식 seq 로 단건 조회 후 편집 다이얼로그를 연다. (피드백 탭의 사용 지식 열기) */
    const openKnowledgeBySeq = async (seq: number) => {
        try {
            const response = await chatbotManageApi.getKnowledge(seq);
            if (!response.knowledge) throw new Error("지식 정보를 찾을 수 없습니다.");
            openKnowledgeDialog(response.knowledge);
        } catch (error) {
            ErrorAlert({ message: toErrorMessage(error, "지식 정보를 불러올 수 없습니다.") });
        }
    };

    /**
     * 신규 지식 등록 다이얼로그를 연다.
     *
     * 문자열을 넘기면 제목만 채운다(지식 갭·피드백의 "등록" 은 질문을 제목으로 쓴다).
     * 자유서술 정리를 거친 경우에는 제목·분류·본문을 함께 넘긴다.
     */
    const openKnowledgeCreate = (prefill?: string | KnowledgeCreatePrefill) => {
        const values = typeof prefill === "string" ? { title: prefill } : (prefill ?? {});
        state.setValue("dialogMode", "create");
        state.setValue("dialogRow", null);
        form.setFormValues({
            ...defaultKnowledgeFormValues,
            title: values.title ?? "",
            category: values.category ?? "",
            content: values.content ?? "",
        });
        modals.knowledge.open();
    };

    /** 지식을 삭제한다. (교육자 전용 — 편집 창과 목록 양쪽에서 호출된다) */
    const deleteKnowledge = async (seq: number) => {
        try {
            await chatbotManageApi.deleteKnowledge(seq);
            SuccessAlert({ message: "지식이 삭제되었습니다.", delay: 500 });
            // 편집 창이 닫힌 상태에서 close() 를 부르면 history.back() 이 한 칸을 헛되이 먹어
            // 이전 화면으로 나가버린다(목록에서 바로 지우는 호출자가 생길 때를 위한 가드).
            if (modals.knowledge.isOpen) modals.knowledge.close();
            await reloadAfterChange();
        } catch (error) {
            ErrorAlert({ message: toErrorMessage(error, "지식 삭제 중 오류가 발생했습니다.") });
        }
    };

    /** 처리 끝난 답변 피드백을 목록에서 지운다. (교육자 전용) */
    const deleteFeedback = async (seq: number) => {
        try {
            await chatbotManageApi.deleteFeedback(seq);
            SuccessAlert({ message: "피드백이 삭제되었습니다.", delay: 500 });
            await state.actions.loadFeedback();
        } catch (error) {
            ErrorAlert({ message: toErrorMessage(error, "피드백 삭제 중 오류가 발생했습니다.") });
        }
    };

    /** 편집 중인 지식을 재검증(verified_time 갱신)한다. (교육자 전용) */
    const reverifyKnowledge = async (seq: number) => {
        try {
            await chatbotManageApi.reverifyKnowledge(seq);
            SuccessAlert({ message: "재검증되었습니다.", delay: 500 });
            await reloadAfterChange();
            // 다이얼로그 표시 원본도 최신 검증일시로 갱신한다.
            const refreshed = await chatbotManageApi.getKnowledge(seq);
            if (refreshed.knowledge) {
                state.setValue("dialogRow", refreshed.knowledge);
            }
        } catch (error) {
            ErrorAlert({ message: toErrorMessage(error, "재검증 중 오류가 발생했습니다.") });
        }
    };

    return {
        state,
        form,
        modals,
        openKnowledgeDialog,
        openKnowledgeBySeq,
        openKnowledgeCreate,
        deleteKnowledge,
        deleteFeedback,
        reverifyKnowledge,
    };
}

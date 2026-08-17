/** @ehfuse/chatbot-ui 공개 export 배럴이다. */

// 타입
export type {
    ChatbotAccount,
    ChatbotConfig,
    ChatbotSelectOptions,
    ChatbotSelectOptionsHook,
} from "./types/provider";
export type {
    ChatMessage,
    ChatOption,
    ChatSessionSummary,
    ChatbotState,
    InquiryDraft,
    ReplaceCandidate,
    StreamingState,
} from "./types";
export type * from "./types/manage";

// Provider + 횡단 관심사 훅
export {
    ChatbotProvider,
    useChatbotAccount,
    useChatbotConfig,
    useChatbotFormDialog,
    useChatbotNavigate,
    useChatbotSelectOptions,
    useIsHeadOffice,
    useIsTrainer,
    type ChatbotProviderProps,
} from "./ChatbotProvider";

// 상담 화면 — 상주 호스트 / 드로어 / 패널 / 팝업 창 페이지
export { ChatbotHostView } from "./views/ChatbotHostView";
export { ChatbotDrawer } from "./views/ChatbotDrawer";
export { ChatPanel } from "./views/ChatPanel";
export { default as ChatPopupPage } from "./views/ChatPopupPage";

// 관리 화면 — 5탭 페이지 + 지식 편집 다이얼로그 전역 호스트
export {
    default as ChatbotManageRoutePage,
    type ChatbotManageRoutePageProps,
} from "./views/manage/ManageRoutePage";
export { default as ChatbotManagePage, type ChatbotManagePageProps } from "./views/manage/ManagePage";
export { KnowledgeDialogHost } from "./views/KnowledgeDialogHost";
export { KnowledgeDialog } from "./views/manage/dialogs/KnowledgeDialog";

// 상태 컨트롤러(소비처가 드로어를 열거나 상태를 읽을 때 쓴다)
export { useChatbotController } from "./controllers/chatbotController";
export {
    KNOWLEDGE_CATEGORY_OPTION_TYPE,
    useChatbotManageController,
    type ChatbotModalControl,
} from "./controllers/manageController";
export { initialChatbotState } from "./state/defaults";

// API (앱이 직접 호출할 일이 있을 때)
export * from "./apis/chatbotApi";
export { chatbotManageApi } from "./apis/manageApi";
export type {
    KnowledgeItemResponse,
    KnowledgeListParams,
    KnowledgeListResponse,
    KnowledgeSavePayload,
    FeedbackListParams,
    StatsParams,
} from "./apis/manageApi";
export { useChatRealtime } from "./apis/chatRealtime";
export type { ChatChunkData, ChatErrorData, ChatMessageData, ChatRealtimeHandlers } from "./apis/chatRealtime";

// 유틸 — 팝업 창 열기 / 지식 다이얼로그 열기 등록소
export { CHAT_POPUP_PATH, openChatPopup } from "./utils/chatPopup";
export { openKnowledgeDialogBySeq, registerKnowledgeDialogOpener } from "./utils/knowledgeDialogHost";
export { useChatImageViewer } from "./utils/chatImageViewer";

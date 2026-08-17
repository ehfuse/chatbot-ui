import type { ChatMessage, ChatSessionSummary, InquiryDraft, StreamingState } from "./chatMessage";

/** 챗봇 상담 드로어 전역 상태 타입이다. */
export interface ChatbotState {
    isDrawerOpen: boolean; // 상담 드로어 열림 여부
    view: "chat" | "sessions" | "inquiry"; // 드로어 화면 (대화/이전대화 목록/문의 등록)
    conversationSeq: number | null; // 현재 세션 seq
    messages: ChatMessage[]; // 현재 세션 메시지
    feedbackByIndex: Record<number, "good" | "bad">; // 메시지 인덱스별 내 평가(새로고침 후에도 👍/👎 유지)
    sending: boolean; // 전송/응답 대기 중 여부
    streaming: StreamingState | null; // 스트리밍 수신 중 상태
    sessions: ChatSessionSummary[]; // 이전 세션 목록
    inquiryDraft: InquiryDraft | null; // 문의 초안 (확인 화면)
    loadError: string | null; // 세션 로드 오류 메시지
}

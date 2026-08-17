import type { ChatbotState } from "../types";

/** 챗봇 상태 초기값이다. */
export const initialChatbotState: ChatbotState = {
    isDrawerOpen: false,
    view: "chat",
    conversationSeq: null,
    messages: [],
    feedbackByIndex: {},
    sending: false,
    streaming: null,
    sessions: [],
    inquiryDraft: null,
    loadError: null,
};

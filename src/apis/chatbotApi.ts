/** 챗봇 상담 API — /v1/chatbot (전송/세션/피드백/문의). */

import { entityAppServer } from "entity-client";
import { getChatbotRequestHeaders } from "../internal/requestHeaders";
import type { ChatMessage, ChatSessionSummary, InquiryDraft } from "../types";

/** 공통 응답 봉투 */
interface ApiEnvelope<T> {
    ok?: boolean; // 성공 여부
    error?: string; // 오류 메시지
    data?: T; // http 래퍼가 감싸는 경우
}

/** 채팅 전송 응답 */
export interface ChatSendResponse {
    ok: boolean; // 성공 여부
    conversation_seq: number; // 세션 seq
    streaming?: boolean; // 스트리밍 모드(청크는 realtime 으로 수신)
    message_index: number; // 답변 메시지 인덱스
    reply?: ChatMessage; // 비스트리밍 완성 답변
    error?: string; // 오류 메시지
}

/** 첨부 이미지 입력 */
export interface ChatImageInput {
    file_name: string; // 파일명
    data_url: string; // data URL
}

/** 메시지를 전송한다 (realtime 연결 헤더를 실어 스트리밍을 요청한다). */
export async function sendChatMessage(input: {
    conversationSeq: number | null;
    message: string;
    selectedValue?: boolean;
    displayLabel?: string;
    images?: ChatImageInput[];
}): Promise<ChatSendResponse> {
    const res = await entityAppServer.http.post<ChatSendResponse & ApiEnvelope<ChatSendResponse>>(
        "/v1/chatbot/chat",
        {
            ...(input.conversationSeq ? { conversation_seq: input.conversationSeq } : {}),
            message: input.message,
            ...(input.selectedValue ? { selected_value: true } : {}),
            ...(input.displayLabel?.trim() ? { display_label: input.displayLabel.trim() } : {}),
            ...(input.images?.length ? { images: input.images } : {}),
        },
        true,
        getChatbotRequestHeaders(),
    );
    return (res as ApiEnvelope<ChatSendResponse>).data ?? (res as ChatSendResponse);
}

/** 세션 목록을 조회한다. */
export async function fetchSessions(): Promise<ChatSessionSummary[]> {
    const res = await entityAppServer.http.get<{ ok: boolean; items?: ChatSessionSummary[] }>("/v1/chatbot/sessions");
    return res?.items ?? [];
}

/** 새 세션을 만든다. */
export async function createNewSession(): Promise<number> {
    const res = await entityAppServer.http.post<{ ok: boolean; conversation_seq?: number }>("/v1/chatbot/sessions", {});
    return Number(res?.conversation_seq ?? 0);
}

/** 세션 상세(전체 메시지)를 조회한다. */
export async function fetchSession(
    seq: number
): Promise<{ session: { seq: number; title: string; messages: ChatMessage[] }; feedback: Record<number, "good" | "bad"> } | null> {
    const res = await entityAppServer.http.get<{
        ok: boolean;
        session?: { seq: number; title: string; messages: ChatMessage[] };
        feedback?: Record<number, "good" | "bad">;
    }>(`/v1/chatbot/sessions/${seq}`);
    if (!res?.session) return null;
    // 다시 열었을 때 👍/👎 표시를 복원한다(평가는 메시지 인덱스로 매칭된다).
    return { session: res.session, feedback: res.feedback ?? {} };
}

/** 세션을 보관 처리한다. */
export async function archiveSession(seq: number): Promise<void> {
    await entityAppServer.http.delete<{ ok: boolean }>(`/v1/chatbot/sessions/${seq}`);
}

/** 답변 good/bad 피드백을 등록한다. */
export async function saveAnswerFeedback(input: {
    conversationSeq: number;
    messageIndex: number;
    rating: "good" | "bad";
    knowledgeSeq?: number;
    faqSeq?: number;
    question?: string;
    answer?: string;
}): Promise<void> {
    await entityAppServer.http.post<{ ok: boolean }>("/v1/chatbot/feedback", {
        conversation_seq: input.conversationSeq,
        message_index: input.messageIndex,
        rating: input.rating,
        ...(input.knowledgeSeq ? { knowledge_seq: input.knowledgeSeq } : {}),
        ...(input.faqSeq ? { faq_seq: input.faqSeq } : {}),
        question: input.question ?? "",
        answer: input.answer ?? "",
    });
}

/** 고객센터 문의 초안을 요청한다. */
export async function fetchInquiryDraft(conversationSeq: number): Promise<InquiryDraft | null> {
    const res = await entityAppServer.http.post<{ ok: boolean; draft?: InquiryDraft }>("/v1/chatbot/inquiry/draft", {
        conversation_seq: conversationSeq,
    });
    return res?.draft ?? null;
}

/** 확인된 초안으로 문의를 등록한다. */
export async function registerInquiry(input: {
    conversationSeq: number;
    title: string;
    content: string;
}): Promise<{ postSeq: number; reply: ChatMessage | null }> {
    const res = await entityAppServer.http.post<{ ok: boolean; post_seq?: number; reply?: ChatMessage }>(
        "/v1/chatbot/inquiry",
        { conversation_seq: input.conversationSeq, title: input.title, content: input.content },
    );
    return { postSeq: Number(res?.post_seq ?? 0), reply: res?.reply ?? null };
}

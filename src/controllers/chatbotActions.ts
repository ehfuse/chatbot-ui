/** 챗봇 드로어 액션 모음 — 세션 로드/전송/피드백/문의 흐름을 상태에 반영한다. */

import type { ActionContext } from "@ehfuse/forma";
import { ErrorAlert } from "@ehfuse/alerts";
import {
    archiveSession,
    createNewSession,
    fetchInquiryDraft,
    fetchSession,
    fetchSessions,
    registerInquiry,
    sendChatMessage,
    type ChatImageInput,
} from "../apis/chatbotApi";
import type { ChatbotState, ChatMessage, ChatSessionSummary } from "../types";

/** 고객센터 등록 요청 선택지 value (AS persona 와 일치) */
export const INQUIRY_REQUEST_VALUE = "고객센터에 등록해주세요";

/**
 * 드로어 첫 열림 시 세션 목록만 로드한다 — 마지막 대화를 자동으로 열지 않고,
 * 인사화면 아래 "최근 대화" 바로가기 목록으로 보여준다(그냥 입력하면 새 대화다).
 */
export const loadActiveSession = () => async (ctx: ActionContext<ChatbotState>): Promise<void> => {
    try {
        const sessions = await fetchSessions();
        ctx.setValue("sessions", sessions);
        ctx.setValue("conversationSeq", null);
        ctx.setValue("messages", []);
        ctx.setValue("feedbackByIndex", {});
    } catch {
        ctx.setValue("loadError", "대화를 불러오지 못했습니다.");
    }
};

/** 특정 세션을 연다 (이전 대화 목록에서 선택). */
export const openSession = () => async (ctx: ActionContext<ChatbotState>, seq: number): Promise<void> => {
    try {
        const loaded = await fetchSession(seq);
        if (!loaded) return;
        ctx.setValue("conversationSeq", loaded.session.seq);
        ctx.setValue("messages", loaded.session.messages);
        ctx.setValue("feedbackByIndex", loaded.feedback);
        ctx.setValue("view", "chat");
    } catch {
        ErrorAlert("대화를 불러오지 못했습니다.");
    }
};

/** 새 대화를 시작한다. */
export const startNewSession = () => async (ctx: ActionContext<ChatbotState>): Promise<void> => {
    try {
        const seq = await createNewSession();
        ctx.setValue("conversationSeq", seq > 0 ? seq : null);
        ctx.setValue("messages", []);
        ctx.setValue("feedbackByIndex", {});
        ctx.setValue("streaming", null);
        ctx.setValue("view", "chat");
        // 방금 끝낸 대화가 인사화면 "최근 대화" 에 바로 보이도록 목록을 다시 읽는다.
        ctx.setValue("sessions", await fetchSessions());
    } catch {
        ErrorAlert("새 대화를 시작하지 못했습니다.");
    }
};

/** 이전 대화 목록 화면을 연다. */
export const openSessionList = () => async (ctx: ActionContext<ChatbotState>): Promise<void> => {
    try {
        ctx.setValue("sessions", await fetchSessions());
    } catch {
        // 목록 조회 실패는 조용히 무시 (기존 목록 유지)
    }
    ctx.setValue("view", "sessions");
};

/** 세션을 삭제(보관)한다. */
export const removeSession = () => async (ctx: ActionContext<ChatbotState>, seq: number): Promise<void> => {
    try {
        await archiveSession(seq);
        const remaining = (ctx.getValue("sessions") as ChatSessionSummary[]).filter((session) => session.seq !== seq);
        ctx.setValue("sessions", remaining);
        if (ctx.getValue("conversationSeq") === seq) {
            ctx.setValue("conversationSeq", null);
            ctx.setValue("messages", []);
            ctx.setValue("feedbackByIndex", {});
        }
    } catch {
        ErrorAlert("대화를 삭제하지 못했습니다.");
    }
};

/**
 * 메시지를 전송한다. 선택지 버튼 클릭도 이 액션을 쓴다(selectedValue=true, displayLabel=버튼 라벨).
 * 고객센터 등록 요청 value 는 서버로 보내지 않고 문의 흐름을 연다.
 */
export const sendMessage = () =>
    async (
        ctx: ActionContext<ChatbotState>,
        message: string,
        images: ChatImageInput[],
        selectedValue: boolean,
        displayLabel?: string
    ): Promise<void> => {
        const text = message.trim();
        if (!text || ctx.getValue("sending")) return;

        if (text === INQUIRY_REQUEST_VALUE) {
            await openInquiryFlow(ctx);
            return;
        }

        // 사용자 말풍선을 즉시 표시한다 — 선택지 클릭이면 명령 value 대신 버튼 라벨을 보여준다.
        const bubbleText = (selectedValue && displayLabel?.trim()) || text;
        const userMessage: ChatMessage = {
            role: "user",
            content: bubbleText,
            // 첨부 이미지는 업로드 전이라 UUID 가 없다 — 보낸 즉시 보이도록 로컬 data URL 로 표시한다.
            ...(images.length > 0 ? { local_image_urls: images.map((image) => image.data_url) } : {}),
            ...(selectedValue ? { selected_value: text } : {}),
        };
        ctx.setValue("messages", [...ctx.getValue("messages"), userMessage]);
        ctx.setValue("sending", true);
        try {
            const res = await sendChatMessage({
                conversationSeq: ctx.getValue("conversationSeq"),
                message: text,
                selectedValue,
                displayLabel,
                images,
            });
            if (!res?.ok) throw new Error(res?.error || "전송에 실패했습니다.");
            ctx.setValue("conversationSeq", res.conversation_seq);
            if (res.streaming) {
                // 청크는 realtime 으로 수신 — 표시 준비만 한다.
                ctx.setValue("streaming", { messageIndex: res.message_index, text: "" });
            } else if (res.reply) {
                ctx.setValue("messages", [...ctx.getValue("messages"), res.reply]);
                ctx.setValue("sending", false);
            } else {
                ctx.setValue("sending", false);
            }
        } catch (err) {
            ctx.setValue("sending", false);
            ErrorAlert(err instanceof Error ? err.message : "전송에 실패했습니다.");
        }
    };

/** 고객센터 문의 흐름을 연다 — 초안 생성 후 확인 화면으로 전환. */
async function openInquiryFlow(ctx: ActionContext<ChatbotState>): Promise<void> {
    const conversationSeq = ctx.getValue("conversationSeq");
    if (!conversationSeq) {
        ErrorAlert("먼저 상담 내용을 입력해주세요.");
        return;
    }
    ctx.setValue("sending", true);
    try {
        const draft = await fetchInquiryDraft(conversationSeq);
        if (!draft) throw new Error("초안 생성에 실패했습니다.");
        ctx.setValue("inquiryDraft", draft);
        ctx.setValue("view", "inquiry");
    } catch (err) {
        ErrorAlert(err instanceof Error ? err.message : "문의 초안 생성에 실패했습니다.");
    } finally {
        ctx.setValue("sending", false);
    }
}

/** 확인된 초안으로 문의를 등록한다. */
export const submitInquiry = () =>
    async (ctx: ActionContext<ChatbotState>, title: string, content: string): Promise<void> => {
        const conversationSeq = ctx.getValue("conversationSeq");
        if (!conversationSeq) return;
        ctx.setValue("sending", true);
        try {
            const result = await registerInquiry({ conversationSeq, title, content });
            if (result.reply) {
                ctx.setValue("messages", [...ctx.getValue("messages"), result.reply]);
            }
            ctx.setValue("inquiryDraft", null);
            ctx.setValue("view", "chat");
        } catch (err) {
            ErrorAlert(err instanceof Error ? err.message : "문의 등록에 실패했습니다.");
        } finally {
            ctx.setValue("sending", false);
        }
    };

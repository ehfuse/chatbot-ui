/** 챗봇 realtime 수신 — 답변 청크/완료/오류/추가 메시지 이벤트 구독 (설계 5.12). */

import { useEffect, useRef } from "react";
import { entityAppServer } from "entity-client";
import type { ChatMessage } from "../types";

/** 청크 이벤트 payload */
export interface ChatChunkData {
    conversation_seq: number; // 세션 seq
    message_index: number; // 답변 메시지 인덱스
    seq_no: number; // 청크 순번
    delta: string; // 본문 델타
}

/** 완료/추가 메시지 이벤트 payload */
export interface ChatMessageData {
    conversation_seq: number; // 세션 seq
    message_index: number; // 메시지 인덱스
    message: ChatMessage; // 완성 메시지
}

/** 오류 이벤트 payload */
export interface ChatErrorData {
    conversation_seq: number; // 세션 seq
    message_index: number; // 답변 메시지 인덱스
    error: string; // 오류 메시지
}

/** 수신 콜백 묶음 */
export interface ChatRealtimeHandlers {
    onChunk: (data: ChatChunkData) => void; // 청크 수신
    onDone: (data: ChatMessageData) => void; // 답변 완료
    onMessage: (data: ChatMessageData) => void; // 추가 메시지 (지식 확인 등)
    onError: (data: ChatErrorData) => void; // 답변 실패
}

/** realtime envelope 형태 (필요 필드만) */
interface RealtimeEnvelopeLike {
    channel?: string;
    event?: string;
    data?: unknown;
}

/** 챗봇 realtime 이벤트를 구독한다 (드로어 단일 마운트 전제 — 컴포넌트 수명 구독). */
export function useChatRealtime(handlers: ChatRealtimeHandlers): void {
    const handlersRef = useRef(handlers);
    // 콜백 최신값 유지 — 리스너 재등록 없이 ref 로 갱신한다.
    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        const client = entityAppServer as unknown as {
            addRealtimeEventListener?: (event: string, handler: (envelope: RealtimeEnvelopeLike) => void) => void;
            removeRealtimeEventListener?: (event: string, handler: (envelope: RealtimeEnvelopeLike) => void) => void;
            connectRealtime?: () => Promise<void>;
        };
        const onChunk = (envelope: RealtimeEnvelopeLike) => {
            handlersRef.current.onChunk(envelope.data as ChatChunkData);
        };
        const onDone = (envelope: RealtimeEnvelopeLike) => {
            handlersRef.current.onDone(envelope.data as ChatMessageData);
        };
        const onMessage = (envelope: RealtimeEnvelopeLike) => {
            handlersRef.current.onMessage(envelope.data as ChatMessageData);
        };
        const onError = (envelope: RealtimeEnvelopeLike) => {
            handlersRef.current.onError(envelope.data as ChatErrorData);
        };
        client.addRealtimeEventListener?.("chatbot.chunk", onChunk);
        client.addRealtimeEventListener?.("chatbot.done", onDone);
        client.addRealtimeEventListener?.("chatbot.message", onMessage);
        client.addRealtimeEventListener?.("chatbot.error", onError);
        void client.connectRealtime?.().catch(() => undefined);
        return () => {
            client.removeRealtimeEventListener?.("chatbot.chunk", onChunk);
            client.removeRealtimeEventListener?.("chatbot.done", onDone);
            client.removeRealtimeEventListener?.("chatbot.message", onMessage);
            client.removeRealtimeEventListener?.("chatbot.error", onError);
        };
    }, []);
}

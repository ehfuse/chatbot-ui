/**
 * entity-client 목업이다.
 *
 * 패키지는 `entityAppServer.http` 로 앱 서버(`/v1/chatbot/*`)를 부르고, 답변 본문은
 * realtime 이벤트(`chatbot.chunk` / `chatbot.done`)로 흘려받는다. 예제에는 서버가 없으므로
 * vite alias 로 이 파일을 `entity-client` 자리에 끼워 넣어 메모리에서 흉내 낸다.
 */

import {
    MOCK_ANSWERS,
    MOCK_CANDIDATES,
    MOCK_FEEDBACK,
    MOCK_GAPS,
    MOCK_KNOWLEDGE,
    MOCK_LICENSES,
    MOCK_SESSIONS,
    MOCK_SESSION_MESSAGES,
    MOCK_STATS,
    MOCK_USAGE,
    daysAgo,
} from "./data";
import type { ChatMessage, ChatSessionSummary, KnowledgeRow } from "@ehfuse/chatbot-ui";

/** 응답 지연(ms) — 로딩 표시가 보이도록 살짝 준다. */
const LATENCY_MS = 180;

/** 답변 글자를 흘려보내는 간격(ms). */
const STREAM_INTERVAL_MS = 18;

/** 한 번에 흘려보내는 글자 수. */
const STREAM_CHUNK_SIZE = 3;

// ─────────────────────────────── 메모리 저장소 ───────────────────────────────

/** 지식 저장소(지식 + 후보를 한 배열로 둔다 — 서버도 같은 테이블이다). */
let knowledgeStore: KnowledgeRow[] = [...MOCK_KNOWLEDGE, ...MOCK_CANDIDATES];
/** 피드백 저장소. */
let feedbackStore = [...MOCK_FEEDBACK];
/** 세션 목록 저장소. */
let sessionStore: ChatSessionSummary[] = [...MOCK_SESSIONS];
/** 세션별 메시지 저장소. */
const messageStore: Record<number, ChatMessage[]> = JSON.parse(JSON.stringify(MOCK_SESSION_MESSAGES));
/** 다음에 발급할 seq. */
let nextSeq = 9000;

/** 새 seq 를 발급한다. */
function issueSeq(): number {
    nextSeq += 1;
    return nextSeq;
}

// ─────────────────────────────── realtime 흉내 ───────────────────────────────

/** 이벤트 이름별 리스너 목록이다. */
const listeners = new Map<string, Set<(envelope: { channel?: string; event?: string; data?: unknown }) => void>>();

/** 이벤트를 구독자들에게 흘린다. */
function emit(event: string, data: unknown): void {
    listeners.get(event)?.forEach((handler) => handler({ channel: "chatbot", event, data }));
}

/** 질문에 맞는 목업 답변을 고른다. */
function pickAnswer(message: string) {
    return MOCK_ANSWERS.find((answer) => answer.match.test(message)) ?? MOCK_ANSWERS[MOCK_ANSWERS.length - 1];
}

/** 답변 본문을 조금씩 흘려보낸 뒤 완료 이벤트를 쏜다. */
function streamAnswer(conversationSeq: number, messageIndex: number, question: string): void {
    const answer = pickAnswer(question);
    let cursor = 0;
    let seqNo = 0;

    const timer = setInterval(() => {
        if (cursor >= answer.text.length) {
            clearInterval(timer);
            const message: ChatMessage = {
                role: "assistant",
                content: answer.text,
                options: answer.options,
                knowledge_seq: answer.knowledgeSeq,
                time: daysAgo(0, new Date().getHours(), new Date().getMinutes()),
            };
            messageStore[conversationSeq] = [...(messageStore[conversationSeq] ?? []), message];
            emit("chatbot.done", { conversation_seq: conversationSeq, message_index: messageIndex, message });
            return;
        }
        const delta = answer.text.slice(cursor, cursor + STREAM_CHUNK_SIZE);
        cursor += STREAM_CHUNK_SIZE;
        seqNo += 1;
        emit("chatbot.chunk", { conversation_seq: conversationSeq, message_index: messageIndex, seq_no: seqNo, delta });
    }, STREAM_INTERVAL_MS);
}

// ─────────────────────────────── 라우팅 ───────────────────────────────

/** 주소에서 경로와 쿼리를 분리한다. */
function parseUrl(url: string): { path: string; query: URLSearchParams } {
    const [path, search = ""] = url.split("?");
    return { path, query: new URLSearchParams(search) };
}

/** 지식 목록 필터를 적용한다. */
function filterKnowledge(query: URLSearchParams): KnowledgeRow[] {
    const status = query.get("status") ?? "";
    const category = query.get("category") ?? "";
    const search = (query.get("search") ?? "").trim().toLowerCase();
    const scope = query.get("scope") ?? "";
    const excludeCandidate = query.get("exclude_candidate") === "1";

    return knowledgeStore.filter((row) => {
        if (status && row.status !== status) return false;
        if (excludeCandidate && row.status === "candidate") return false;
        if (category && row.category !== category) return false;
        if (scope === "shared" && row.target_license_seq != null) return false;
        if (scope && scope !== "shared" && String(row.target_license_seq ?? "") !== scope) return false;
        if (search && !`${row.title} ${row.content} ${row.tags}`.toLowerCase().includes(search)) return false;
        return true;
    });
}

/** GET 요청을 처리한다. */
function handleGet(url: string): unknown {
    const { path, query } = parseUrl(url);

    if (path === "/v1/chatbot/sessions") return { ok: true, items: sessionStore };
    if (path.startsWith("/v1/chatbot/sessions/")) {
        const seq = Number(path.split("/").pop());
        const messages = messageStore[seq];
        if (!messages) return { ok: false };
        const summary = sessionStore.find((session) => session.seq === seq);
        return { ok: true, session: { seq, title: summary?.title ?? "대화", messages }, feedback: {} };
    }

    if (path === "/v1/chatbot/knowledge/licenses") return { ok: true, items: MOCK_LICENSES };
    if (path === "/v1/chatbot/knowledge/duplicates") {
        // 제목이 비슷한 두 건을 중복 의심으로 보여준다.
        const items = knowledgeStore.filter((row) => row.seq === 101 || row.seq === 102);
        return { ok: true, groups: items.length === 2 ? [{ score: 0.82, items }] : [] };
    }
    if (path.startsWith("/v1/chatbot/knowledge/")) {
        const seq = Number(path.split("/").pop());
        return { ok: true, knowledge: knowledgeStore.find((row) => row.seq === seq) };
    }
    if (path === "/v1/chatbot/knowledge") {
        const filtered = filterKnowledge(query);
        const page = Number(query.get("page") ?? 1);
        const limit = Number(query.get("limit") ?? 50);
        return { ok: true, items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
    }

    if (path === "/v1/chatbot/feedback") {
        const rating = query.get("rating");
        return { ok: true, items: rating ? feedbackStore.filter((row) => row.rating === rating) : feedbackStore };
    }

    if (path === "/v1/chatbot/stats/usage") return { ok: true, usage: MOCK_USAGE };
    if (path === "/v1/chatbot/stats/gaps") return { ok: true, items: MOCK_GAPS };
    if (path === "/v1/chatbot/stats") return { ok: true, stats: MOCK_STATS };

    return { ok: true };
}

/** POST 요청을 처리한다. */
function handlePost(url: string, body: Record<string, unknown>): unknown {
    const { path } = parseUrl(url);

    if (path === "/v1/chatbot/chat") {
        const conversationSeq = Number(body.conversation_seq ?? 0) || issueSeq();
        const message = String(body.message ?? "");
        const current = messageStore[conversationSeq] ?? [];
        messageStore[conversationSeq] = [...current, { role: "user", content: message }];
        const messageIndex = messageStore[conversationSeq].length;

        if (!sessionStore.some((session) => session.seq === conversationSeq)) {
            sessionStore = [
                { seq: conversationSeq, title: message.slice(0, 20) || "새 대화", message_count: 1, last_message: message },
                ...sessionStore,
            ];
        }

        // 응답을 먼저 돌려주고, 본문은 realtime 으로 흘린다(서버와 같은 순서).
        setTimeout(() => streamAnswer(conversationSeq, messageIndex, message), LATENCY_MS);
        return { ok: true, conversation_seq: conversationSeq, streaming: true, message_index: messageIndex };
    }

    if (path === "/v1/chatbot/sessions") {
        const seq = issueSeq();
        messageStore[seq] = [];
        return { ok: true, conversation_seq: seq };
    }

    if (path === "/v1/chatbot/feedback") return { ok: true };
    if (path === "/v1/chatbot/media") return { ok: true, uuid: `mock-${issueSeq()}`, name: String(body.file_name ?? "") };

    if (path === "/v1/chatbot/inquiry/draft") {
        return {
            ok: true,
            draft: {
                title: "빈소 재고 이동 문의",
                content: "빈소 재고를 다른 빈소로 옮기는 방법을 알고 싶습니다.",
                image_uuids: [],
            },
        };
    }
    if (path === "/v1/chatbot/inquiry") return { ok: true, post_seq: 774, reply: null };

    if (path === "/v1/chatbot/knowledge/draft-answer") {
        return {
            ok: true,
            draft:
                `## ${String(body.title ?? "")}\n\n` +
                `${String(body.notes ?? "")}\n\n` +
                "위 내용을 목업이 마크다운으로 다듬은 결과입니다.",
        };
    }
    if (path.endsWith("/reverify")) {
        const seq = Number(path.split("/").slice(-2)[0]);
        knowledgeStore = knowledgeStore.map((row) =>
            row.seq === seq ? { ...row, verified_time: daysAgo(0), status: "verified" as const } : row
        );
        return { ok: true };
    }
    if (path === "/v1/chatbot/knowledge") {
        const seq = issueSeq();
        const created: KnowledgeRow = {
            ...(knowledgeStore[0] as KnowledgeRow),
            ...(body as Partial<KnowledgeRow>),
            seq,
            media_uuids: (body.media_uuids as string[]) ?? [],
            good_count: 0,
            bad_count: 0,
            created_time: daysAgo(0),
            updated_time: daysAgo(0),
        };
        knowledgeStore = [created, ...knowledgeStore];
        return { ok: true, knowledge: created };
    }

    return { ok: true };
}

/** PATCH 요청을 처리한다. */
function handlePatch(url: string, body: Record<string, unknown>): unknown {
    const { path } = parseUrl(url);
    if (path.startsWith("/v1/chatbot/knowledge/")) {
        const seq = Number(path.split("/").pop());
        let updated: KnowledgeRow | undefined;
        knowledgeStore = knowledgeStore.map((row) => {
            if (row.seq !== seq) return row;
            updated = { ...row, ...(body as Partial<KnowledgeRow>), seq, updated_time: daysAgo(0) };
            return updated;
        });
        return { ok: true, knowledge: updated };
    }
    return { ok: true };
}

/** DELETE 요청을 처리한다. */
function handleDelete(url: string): unknown {
    const { path } = parseUrl(url);
    if (path.startsWith("/v1/chatbot/knowledge/")) {
        const seq = Number(path.split("/").pop());
        knowledgeStore = knowledgeStore.filter((row) => row.seq !== seq);
        return { ok: true };
    }
    if (path.startsWith("/v1/chatbot/feedback/")) {
        const seq = Number(path.split("/").pop());
        feedbackStore = feedbackStore.filter((row) => row.seq !== seq);
        return { ok: true };
    }
    if (path.startsWith("/v1/chatbot/sessions/")) {
        const seq = Number(path.split("/").pop());
        sessionStore = sessionStore.filter((session) => session.seq !== seq);
        return { ok: true };
    }
    return { ok: true };
}

/** 지연을 주고 결과를 돌려준다. */
function respond<T>(value: unknown): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value as T), LATENCY_MS));
}

// ─────────────────────────────── 공개 객체 ───────────────────────────────

/** entity-client 의 `entityAppServer` 를 흉내 낸 목업이다. */
export const entityAppServer = {
    http: {
        get: <T>(url: string): Promise<T> => respond<T>(handleGet(url)),
        post: <T>(url: string, body: Record<string, unknown> = {}): Promise<T> => respond<T>(handlePost(url, body)),
        patch: <T>(url: string, body: Record<string, unknown> = {}): Promise<T> => respond<T>(handlePatch(url, body)),
        delete: <T>(url: string): Promise<T> => respond<T>(handleDelete(url)),
    },

    /** realtime 이벤트를 구독한다. */
    addRealtimeEventListener(event: string, handler: (envelope: { data?: unknown }) => void): void {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(handler);
    },

    /** realtime 구독을 해제한다. */
    removeRealtimeEventListener(event: string, handler: (envelope: { data?: unknown }) => void): void {
        listeners.get(event)?.delete(handler);
    },

    /** 연결을 흉내 낸다(목업은 항상 연결돼 있다). */
    connectRealtime(): Promise<void> {
        return Promise.resolve();
    },
};

/** 목업 저장소를 처음 상태로 되돌린다(예제 화면의 "초기화" 버튼용). */
export function resetMockStore(): void {
    knowledgeStore = [...MOCK_KNOWLEDGE, ...MOCK_CANDIDATES];
    feedbackStore = [...MOCK_FEEDBACK];
    sessionStore = [...MOCK_SESSIONS];
}

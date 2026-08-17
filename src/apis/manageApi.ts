/**
 * manageApi.ts
 *
 * 챗봇 관리(지식/피드백/통계) AS API 순수 함수 래퍼.
 * base 는 AS `/v1/chatbot` 이며 entityAppServer.http 로 호출한다.
 * 조회·변경 모두 교육자 권한을 서버가 강제한다(requireTrainer).
 */
import { entityAppServer } from "entity-client";
import type {
    ChatbotStats,
    ChatbotUsage,
    DuplicateGroup,
    FeedbackRow,
    GapRow,
    KnowledgeRow,
    KnowledgeSort,
} from "../types/manage";

/** 지식 목록 조회 파라미터 타입이다. */
export interface KnowledgeListParams {
    status?: string; // 상태 필터(candidate/unverified/verified/rejected)
    category?: string; // 분류 필터
    search?: string; // 검색어
    stale?: boolean; // 오래된 지식만 조회
    excludeCandidate?: boolean; // 후보 제외(지식 탭 "전체" — 후보는 전용 탭에서 다룬다)
    scope?: string; // 스코프 필터("shared"=공용만, 숫자문자열=그 가맹점)
    sort?: KnowledgeSort; // 정렬 기준(미지정=최근 수정순)
    sortDir?: "ASC" | "DESC"; // 정렬 방향
    page?: number; // 페이지
    limit?: number; // 페이지 크기
}


/** 지식 저장 payload 타입이다. */
export interface KnowledgeSavePayload {
    title?: string; // 제목
    content?: string; // 본문
    category?: string; // 분류
    status?: string; // 지식 상태
    target_license_seq?: number | null; // 대상 가맹점(null=공용)
    media_uuids?: string[]; // 첨부 이미지 UUID 목록
    tags?: string; // 검색용 태그(쉼표 구분)
    answer_drafted?: boolean; // 답변 초안을 본문에 반영했는지(서버가 작성자·일시를 찍는다)
}

/** 피드백 목록 조회 파라미터 타입이다. */
export interface FeedbackListParams {
    rating?: "good" | "bad"; // 평가 필터(미지정=전체)
    licenseSeq?: string; // 가맹점 필터(101 전용)
    limit?: number; // 최대 건수
}

/** 통계 조회 파라미터 타입이다. */
export interface StatsParams {
    from: string; // 시작일(YYYY-MM-DD)
    to: string; // 종료일(YYYY-MM-DD)
    licenseSeq?: string; // 가맹점 seq 필터(101 전용)
    licenseName?: string; // 가맹점명 검색어(101 전용 — 서버가 seq 해석)
}

/** 지식 목록 응답 타입이다. */
export interface KnowledgeListResponse {
    ok: boolean; // 성공 여부
    items?: KnowledgeRow[]; // 지식 목록
    total?: number; // 전체 건수
}

/** 지식 단건 응답 타입이다. */
export interface KnowledgeItemResponse {
    ok: boolean; // 성공 여부
    knowledge?: KnowledgeRow; // 지식 행
}

/** 챗봇 관리 API 함수 모음이다. */
export const chatbotManageApi = {
    /** 지식 목록을 조회한다. */
    listKnowledge: (params: KnowledgeListParams) => {
        const qs = new URLSearchParams();
        if (params.status) qs.set("status", params.status);
        if (params.category) qs.set("category", params.category);
        if (params.search && params.search.trim()) qs.set("search", params.search.trim());
        if (params.stale) qs.set("stale", "1");
        if (params.excludeCandidate) qs.set("exclude_candidate", "1");
        if (params.scope) qs.set("scope", params.scope);
        if (params.sort) qs.set("sort", params.sort);
        if (params.sortDir) qs.set("sort_dir", params.sortDir);
        qs.set("page", String(params.page ?? 1));
        qs.set("limit", String(params.limit ?? 50));
        return entityAppServer.http.get<KnowledgeListResponse>(`/v1/chatbot/knowledge?${qs.toString()}`);
    },

    /** 스코프 지정용 장례식장 가맹점 목록을 조회한다. (교육자 전용) */
    listScopeLicenses: () =>
        entityAppServer.http.get<{ ok: boolean; items?: Array<{ seq: number; name: string }> }>(
            "/v1/chatbot/knowledge/licenses"
        ),

    /** 지식 첨부 이미지를 업로드하고 UUID 를 받는다. (교육자 전용 — AS 가 리사이즈·webp 변환) */
    uploadKnowledgeMedia: (params: { entitySeq: number; fileName: string; dataUrl: string }) =>
        entityAppServer.http.post<{ ok: boolean; uuid?: string; name?: string; error?: string }>("/v1/chatbot/media", {
            entity: "chatbot_knowledge",
            entity_seq: params.entitySeq,
            file_name: params.fileName,
            data_url: params.dataUrl,
        }),

    /** 지식 단건을 조회한다. */
    getKnowledge: (seq: number) => entityAppServer.http.get<KnowledgeItemResponse>(`/v1/chatbot/knowledge/${seq}`),

    /** 지식 중복 의심 그룹을 조회한다. */
    listDuplicates: () =>
        entityAppServer.http.get<{ ok: boolean; groups?: DuplicateGroup[] }>("/v1/chatbot/knowledge/duplicates"),

    /** 지식을 저장한다. (seq 가 있으면 수정, 없으면 신규 — 교육자 전용) */
    saveKnowledge: (seq: number, payload: KnowledgeSavePayload) =>
        seq > 0
            ? entityAppServer.http.patch<KnowledgeItemResponse>(`/v1/chatbot/knowledge/${seq}`, payload)
            : entityAppServer.http.post<KnowledgeItemResponse>("/v1/chatbot/knowledge", payload),

    /** 지식을 삭제한다. (교육자 전용) */
    deleteKnowledge: (seq: number) => entityAppServer.http.delete<{ ok: boolean }>(`/v1/chatbot/knowledge/${seq}`),

    /** 지식을 재검증(verified_time 갱신)한다. (교육자 전용) */
    reverifyKnowledge: (seq: number) =>
        entityAppServer.http.post<{ ok: boolean }>(`/v1/chatbot/knowledge/${seq}/reverify`, {}),

    /** 답변 피드백 목록을 조회한다. */
    listFeedback: (params: FeedbackListParams) => {
        const qs = new URLSearchParams();
        if (params.rating) qs.set("rating", params.rating);
        if (params.licenseSeq) qs.set("license_seq", params.licenseSeq);
        qs.set("limit", String(params.limit ?? 200));
        return entityAppServer.http.get<{ ok: boolean; items?: FeedbackRow[] }>(
            `/v1/chatbot/feedback?${qs.toString()}`
        );
    },

    /** 답변 피드백을 삭제한다. (교육자 전용 — 처리 끝난 항목 정리) */
    deleteFeedback: (seq: number) => entityAppServer.http.delete<{ ok: boolean }>(`/v1/chatbot/feedback/${seq}`),

    /** 기간별 운영 통계를 조회한다. */
    getStats: (params: StatsParams) => {
        const qs = new URLSearchParams();
        qs.set("from", params.from);
        qs.set("to", params.to);
        if (params.licenseSeq) qs.set("license_seq", params.licenseSeq);
        if (params.licenseName) qs.set("license_name", params.licenseName);
        return entityAppServer.http.get<{ ok: boolean; stats?: ChatbotStats }>(`/v1/chatbot/stats?${qs.toString()}`);
    },

    /** 교육자의 자유서술을 지식 한 건(제목/분류/본문)으로 정리한다. */
    composeKnowledge: (text: string) =>
        entityAppServer.http.post<{
            ok: boolean;
            draft?: { title: string; category: string; content: string };
            error?: string;
        }>("/v1/chatbot/knowledge/compose", { text }),

    /** 교육자 메모로 지식 본문 초안(마크다운)을 생성한다. */
    draftAnswer: (params: { title: string; situation?: string; notes: string }) =>
        entityAppServer.http.post<{ ok: boolean; draft?: string; error?: string }>(
            "/v1/chatbot/knowledge/draft-answer",
            params
        ),

    /** 기간별 토큰 사용현황(계정별 질문·교육·토큰·예상금액)을 조회한다. */
    getUsage: (params: StatsParams) => {
        const qs = new URLSearchParams();
        qs.set("from", params.from);
        qs.set("to", params.to);
        if (params.licenseSeq) qs.set("license_seq", params.licenseSeq);
        if (params.licenseName) qs.set("license_name", params.licenseName);
        return entityAppServer.http.get<{ ok: boolean; usage?: ChatbotUsage }>(
            `/v1/chatbot/stats/usage?${qs.toString()}`
        );
    },

    /** 지식 갭 리포트 목록을 조회한다. */
    listGaps: (params: { licenseSeq?: string; licenseName?: string; limit?: number }) => {
        const qs = new URLSearchParams();
        if (params.licenseSeq) qs.set("license_seq", params.licenseSeq);
        if (params.licenseName) qs.set("license_name", params.licenseName);
        qs.set("limit", String(params.limit ?? 100));
        return entityAppServer.http.get<{ ok: boolean; items?: GapRow[] }>(`/v1/chatbot/stats/gaps?${qs.toString()}`);
    },
};

/**
 * manage.ts
 *
 * 챗봇 관리 페이지 전용 타입 정의.
 * (배럴 index.ts 에 추가하지 않는다 — 소비처는 이 파일에서 직접 import 한다)
 */

/** 챗봇 지식 상태 값 타입이다. */
export type KnowledgeStatus = "candidate" | "unverified" | "verified" | "rejected";

/** 지식 목록 정렬 기준이다. (AS KnowledgeListSort 와 동일 — 만족도 정렬은 good_count 기준) */
export type KnowledgeSort = "updated_time" | "good_count" | "verified_time" | "title";

/** 챗봇 지식 행 데이터 타입이다. (AS GET /v1/chatbot/knowledge 응답 항목) */
export interface KnowledgeRow {
    target_license_name: string; // 대상 가맹점명(공용이거나 확인 불가면 빈 문자열)
    answer_drafted_by_name: string; // 답변 초안을 본문에 반영한 교육자 이름(없으면 빈 문자열)
    answer_drafted_time: string | null; // 그 반영 일시
    taught_by_name: string; // 가르친 교육자 표시 이름(확인 불가면 빈 문자열)
    asker_name: string; // 출처 대화 질문자 표시 이름(후보 목록용, 확인 불가면 빈 문자열)
    seq: number; // 지식 seq
    target_license_seq: number | null; // 대상 가맹점 seq (null=공용)
    status: KnowledgeStatus; // 지식 상태
    category: string; // 분류
    title: string; // 제목
    content: string; // 본문
    media_uuids: string[]; // 첨부 이미지 UUID 목록
    verified_time: string | null; // 검증(승인) 일시
    taught_by_account_seq: number | null; // 교육한 계정 seq
    source_conversation_seq: number | null; // 출처 대화 seq
    source_post_seq?: number | null; // 출처 고객센터 문의글(board_post) seq — 이관(escalated) 후보만
    good_count: number; // 좋아요 수
    bad_count: number; // 싫어요 수
    tags: string; // 검색용 태그(쉼표 구분)
    candidate_reason: string | null; // 후보 등록 사유 (unanswered/user_taught/escalated)
    created_time?: string; // 등록일시
    updated_time?: string; // 수정일시
}

/** 지식 중복 의심 그룹 타입이다. (AS GET /v1/chatbot/knowledge/duplicates 응답 항목) */
export interface DuplicateGroup {
    score: number; // 그룹 내 최대 유사도(0~1)
    items: KnowledgeRow[]; // 서로 중복 의심인 지식들
}

/** 답변 피드백 행 타입이다. (AS GET /v1/chatbot/feedback 응답 항목) */
export interface FeedbackRow {
    rater_name: string; // 평가자 표시 이름(직원명 우선, 확인 불가면 빈 문자열)
    seq: number; // 피드백 seq
    conversation_seq: number; // 대화 seq
    rating: "good" | "bad"; // 평가
    knowledge_seq: number | null; // 답변에 사용된 지식 seq
    faq_seq: number | null; // 답변에 사용된 FAQ seq
    question_snapshot: string; // 질문 스냅샷
    answer_snapshot: string; // 답변 스냅샷
    license_seq: number; // 가맹점 seq
    created_time: string; // 등록일시
}

/** 챗봇 운영 통계 타입이다. (AS GET /v1/chatbot/stats 응답) */
export interface ChatbotStats {
    sessions: number; // 상담 세션 수
    turns: number; // 총 턴 수
    lowConfidenceTurns: number; // 저확신 턴 수
    escalations: number; // 상담사 이관 건수
    resolvedSessions: number; // 자동 해결 세션 수
    goodCount: number; // 좋아요 수
    badCount: number; // 싫어요 수
}

/** 토큰 단가 타입이다. (AS config.json pricing) */
export interface ChatbotPricing {
    input_usd_per_mtok: number; // 입력 100만 토큰당 USD
    output_usd_per_mtok: number; // 출력 100만 토큰당 USD
    usd_to_krw: number; // 원화 환산 환율
}

/** 사용현황 계정별 행 타입이다. (AS GET /v1/chatbot/stats/usage 응답 항목) */
export interface UsageAccountRow {
    account_seq: number; // 계정 seq
    account_name: string; // 표시 이름(직원명 우선)
    license_seq: number; // 소속 가맹점 seq
    license_name: string; // 가맹점명
    questions: number; // 질문 수
    input_tokens: number; // 입력 토큰
    output_tokens: number; // 출력 토큰
    cost: number; // 예상 금액(원)
    taught_count: number; // 가르친 지식 수
    verified_count: number; // 그중 승인된 지식 수
    last_used_time: string | null; // 마지막 사용 일시
}

/** 사용현황 일자별 행 타입이다. */
export interface UsageDailyRow {
    date: string; // YYYY-MM-DD
    questions: number; // 질문 수
    input_tokens: number; // 입력 토큰
    output_tokens: number; // 출력 토큰
    cost: number; // 예상 금액(원)
}

/** 사용현황 응답 타입이다. */
export interface ChatbotUsage {
    totals: {
        questions: number; // 총 질문 수
        users: number; // 사용 계정 수
        input_tokens: number; // 입력 토큰 합
        output_tokens: number; // 출력 토큰 합
        cost: number; // 예상 금액(원)
        taught_count: number; // 가르친 지식 수
    };
    accounts: UsageAccountRow[]; // 계정별 상세
    daily: UsageDailyRow[]; // 일자별 추이
    pricing: ChatbotPricing; // 계산 근거 단가
}

/** 지식 갭 리포트 행 타입이다. (AS GET /v1/chatbot/stats/gaps 응답 항목) */
export interface GapRow {
    asker_name: string; // 질문자 표시 이름(직원명 우선, 확인 불가면 빈 문자열)
    seq: number; // 갭 seq
    conversation_seq: number; // 대화 seq
    asked_time: string; // 질문 일시
    confidence: number; // 답변 확신도(0~1)
    escalated: boolean; // 상담사 이관 여부
    question_summary: string; // 질문 요약
    license_seq: number; // 가맹점 seq
}

/** 지식 편집 다이얼로그 폼 타입이다. */
export interface KnowledgeForm {
    answer_drafted: boolean; // 이번 편집에서 답변 초안을 본문에 반영했는지(저장 시 서버가 작성자·일시를 찍는다)
    seq: number; // 0 이면 신규 등록
    title: string; // 제목
    category: string; // 분류
    content: string; // 본문
    status: KnowledgeStatus; // 지식 상태
    scope: "shared" | "license"; // 스코프 (공용/가맹점)
    target_license_seq: number | null; // 가맹점 스코프일 때 대상 가맹점 seq
    media_uuids: string[]; // 첨부 이미지 UUID 목록
    tags: string; // 검색용 태그(쉼표 구분)
}

/** 지식 탭 필터 타입이다. */
export interface KnowledgeFilters {
    status: string; // 상태 필터("" = 전체)
    category: string; // 분류 필터("" = 전체)
    scope: string; // 스코프 필터("" = 전체, "shared" = 공용, 숫자문자열 = 그 가맹점)
    stale: boolean; // 오래된 지식만 보기 여부
    search: string; // 검색어
    sort: KnowledgeSort; // 정렬 기준(기본 updated_time = 최근 수정순)
    sortDir: "ASC" | "DESC"; // 정렬 방향
}

/** 챗봇 관리 페이지 전역 상태 타입이다. (stateId: chatbotManageState) */
export interface ChatbotManageState {
    tab: number; // 현재 탭 (0 지식 / 1 지식 후보 / 2 답변 피드백 / 3 분석)

    // 지식 탭
    knowledgeItems: KnowledgeRow[]; // 지식 목록(무한스크롤로 누적된다)
    knowledgeTotal: number; // 현재 필터 기준 건수(무한스크롤 판정용)
    knowledgeTabCount: number; // 탭 배지용 — 필터와 무관한 "폐기·후보 제외" 전체 건수
    candidateTabCount: number; // 탭 배지용 — 지식 후보 건수
    feedbackTabCount: number; // 탭 배지용 — 답변 피드백 건수
    knowledgeLoading: boolean; // 지식 목록 로딩 여부(첫 페이지 조회)
    knowledgeLoadingMore: boolean; // 다음 페이지 추가 로딩 여부(무한스크롤)
    knowledgePage: number; // 현재까지 불러온 마지막 페이지 번호
    knowledgeHasMore: boolean; // 더 불러올 페이지가 남았는지 여부
    knowledgeFilters: KnowledgeFilters; // 지식 탭 필터
    duplicateGroups: DuplicateGroup[]; // 중복 의심 그룹(지식 행 포함)
    duplicateChecking: boolean; // 중복 검사 진행 중 여부
    duplicateOnly: boolean; // "중복의심" 스위치 — 켜면 중복 그룹만 목록에 보여준다

    // 지식 후보 탭
    candidateItems: KnowledgeRow[]; // 지식 후보 목록(status=candidate)
    candidateLoading: boolean; // 후보 목록 로딩 여부

    // 답변 피드백 탭
    feedbackItems: FeedbackRow[]; // 피드백 목록
    feedbackLoading: boolean; // 피드백 로딩 여부
    feedbackRating: "all" | "good" | "bad"; // 평가 필터

    // 분석 탭
    statsFrom: string; // 조회 시작일(YYYY-MM-DD)
    statsTo: string; // 조회 종료일(YYYY-MM-DD)
    statsLicenseSeq: string; // 가맹점 필터(빈 문자열=전체, 101 로그인 전용)
    stats: ChatbotStats | null; // 통계 결과
    statsLoading: boolean; // 통계 로딩 여부
    gapItems: GapRow[]; // 지식 갭 리포트 목록
    usageFrom: string; // 사용현황 조회 시작일(YYYY-MM-DD)
    usageTo: string; // 사용현황 조회 종료일(YYYY-MM-DD)
    usageLicenseSeq: string; // 사용현황 가맹점 필터(빈 문자열=전체, 101 로그인 전용)
    usage: ChatbotUsage | null; // 사용현황 결과
    usageLoading: boolean; // 사용현황 로딩 여부
    answerDraftNotes: string; // 답변 초안 — 교육자가 적은 실제 해결 방법(사실 근거)
    answerDraftResult: string; // 답변 초안 — AI 가 다듬은 마크다운 본문(확인 전에는 반영하지 않는다)
    answerDraftLoading: boolean; // 답변 초안 생성 중 여부

    // 지식 편집 다이얼로그
    dialogMode: "create" | "edit"; // 다이얼로그 모드
    dialogRow: KnowledgeRow | null; // 편집 중인 지식 원본 행
    dialogSaving: boolean; // 저장 진행 중 여부
}

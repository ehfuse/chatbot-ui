/** 목업 데이터다 — 실제 서버 없이 화면 모양을 보기 위한 고정 값 모음이다. */

import type {
    ChatMessage,
    ChatSessionSummary,
    ChatbotStats,
    ChatbotUsage,
    FeedbackRow,
    GapRow,
    KnowledgeRow,
} from "@ehfuse/chatbot-ui";

/** 오늘 기준 n일 전 날짜시간 문자열을 만든다("YYYY-MM-DD HH:mm:ss"). */
export function daysAgo(days: number, hour = 10, minute = 30): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const pad = (value: number) => String(value).padStart(2, "0");
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(hour)}:${pad(minute)}:00`
    );
}

/** 지식 행 하나를 기본값 위에 만들어 준다. */
function knowledge(row: Partial<KnowledgeRow> & Pick<KnowledgeRow, "seq" | "title">): KnowledgeRow {
    return {
        target_license_name: "",
        answer_drafted_by_name: "",
        answer_drafted_time: null,
        taught_by_name: "",
        asker_name: "",
        target_license_seq: null,
        status: "verified",
        category: "",
        content: "",
        media_uuids: [],
        verified_time: daysAgo(3),
        taught_by_account_seq: null,
        source_conversation_seq: null,
        good_count: 0,
        bad_count: 0,
        tags: "",
        candidate_reason: null,
        created_time: daysAgo(20),
        updated_time: daysAgo(3),
        ...row,
    };
}

/** 지식 목록 목업이다(승인/미검증/폐기 섞여 있다). */
export const MOCK_KNOWLEDGE: KnowledgeRow[] = [
    knowledge({
        seq: 101,
        title: "상담 대화창을 새 창으로 띄우는 방법",
        category: "사용법",
        content:
            "상담 대화창 오른쪽 위의 **새 창으로 열기** 를 누르면 대화가 별도 창으로 옮겨집니다.\n\n" +
            "창을 띄워 둔 채로 다른 화면을 계속 쓸 수 있습니다.",
        taught_by_name: "김다연",
        taught_by_account_seq: 103,
        good_count: 12,
        bad_count: 1,
        tags: "팝업,새창,대화창",
    }),
    knowledge({
        seq: 102,
        title: "답변이 이상할 때 알려주는 방법",
        category: "사용법",
        content: "답변 아래 👍 / 👎 를 누르면 교육자에게 전달됩니다. 👎 를 누른 답변은 답변 피드백 탭에 모입니다.",
        taught_by_name: "김다연",
        taught_by_account_seq: 103,
        good_count: 8,
        bad_count: 0,
        tags: "피드백,평가",
    }),
    knowledge({
        seq: 103,
        title: "지식 분류는 어떻게 정하나요",
        category: "운영",
        content: "분류는 자유롭게 적을 수 있고, 한 번 저장한 값은 다음부터 자동완성 목록에 뜹니다.",
        status: "unverified",
        verified_time: null,
        taught_by_name: "박서준",
        good_count: 2,
        bad_count: 0,
    }),
    knowledge({
        seq: 104,
        title: "현황판 2차장지 정보 숨김 설정 방법",
        category: "현황판",
        content: "현황판 설정에서 **2차장지 표시** 를 끄면 화면에서 감춰집니다.",
        target_license_seq: 5,
        target_license_name: "테스트 장례식장",
        taught_by_name: "김다연",
        good_count: 5,
        bad_count: 2,
    }),
    knowledge({
        seq: 105,
        title: "옛날 방식으로 안내하던 내용",
        category: "운영",
        content: "지금은 쓰지 않는 절차라 폐기했습니다.",
        status: "rejected",
        verified_time: null,
        good_count: 0,
        bad_count: 4,
    }),
];

/** 지식 후보 목록 목업이다(status=candidate). */
export const MOCK_CANDIDATES: KnowledgeRow[] = [
    knowledge({
        seq: 201,
        title: "빈소 재고를 다른 빈소로 옮길 수 있나요",
        status: "candidate",
        verified_time: null,
        candidate_reason: "unanswered",
        asker_name: "이현우",
        source_conversation_seq: 3001,
        created_time: daysAgo(1, 14, 5),
        updated_time: daysAgo(1, 14, 5),
    }),
    knowledge({
        seq: 202,
        title: "발주 알림톡이 두 번 오는 경우",
        status: "candidate",
        verified_time: null,
        candidate_reason: "escalated",
        asker_name: "최민서",
        source_post_seq: 774,
        source_conversation_seq: 3002,
        created_time: daysAgo(2, 9, 12),
        updated_time: daysAgo(2, 9, 12),
    }),
    knowledge({
        seq: 203,
        title: "명세서에 상품명을 다르게 찍는 방법",
        status: "candidate",
        verified_time: null,
        candidate_reason: "user_taught",
        asker_name: "김다연",
        source_conversation_seq: 3003,
        created_time: daysAgo(4, 16, 40),
        updated_time: daysAgo(4, 16, 40),
    }),
];

/** 답변 피드백 목록 목업이다. */
export const MOCK_FEEDBACK: FeedbackRow[] = [
    {
        seq: 501,
        rater_name: "이현우",
        conversation_seq: 3001,
        rating: "bad",
        knowledge_seq: 104,
        faq_seq: null,
        question_snapshot: "현황판에서 2차장지를 안 보이게 하려면?",
        answer_snapshot: "현황판 설정에서 표시 항목을 끄면 됩니다.",
        license_seq: 5,
        created_time: daysAgo(1, 15, 22),
    },
    {
        seq: 502,
        rater_name: "최민서",
        conversation_seq: 3002,
        rating: "good",
        knowledge_seq: 101,
        faq_seq: null,
        question_snapshot: "대화창을 따로 띄울 수 있나요?",
        answer_snapshot: "오른쪽 위 새 창으로 열기를 누르면 됩니다.",
        license_seq: 5,
        created_time: daysAgo(2, 11, 3),
    },
    {
        seq: 503,
        rater_name: "",
        conversation_seq: 3004,
        rating: "bad",
        knowledge_seq: null,
        faq_seq: 12,
        question_snapshot: "발주서를 다시 보낼 수 있나요?",
        answer_snapshot: "발주 목록에서 다시 보내기를 누르세요.",
        license_seq: 101,
        created_time: daysAgo(3, 17, 45),
    },
];

/** 운영 통계 목업이다. */
export const MOCK_STATS: ChatbotStats = {
    sessions: 128,
    turns: 542,
    lowConfidenceTurns: 37,
    escalations: 9,
    resolvedSessions: 104,
    goodCount: 86,
    badCount: 14,
};

/** 지식 갭 리포트 목업이다. */
export const MOCK_GAPS: GapRow[] = [
    {
        seq: 601,
        asker_name: "이현우",
        conversation_seq: 3001,
        asked_time: daysAgo(1, 14, 2),
        confidence: 0.32,
        escalated: false,
        question_summary: "빈소 재고를 다른 빈소로 옮기는 방법",
        license_seq: 5,
    },
    {
        seq: 602,
        asker_name: "최민서",
        conversation_seq: 3002,
        asked_time: daysAgo(2, 9, 10),
        confidence: 0.18,
        escalated: true,
        question_summary: "발주 알림톡 중복 발송 원인",
        license_seq: 5,
    },
];

/** 사용현황 목업이다. */
export const MOCK_USAGE: ChatbotUsage = {
    totals: { questions: 542, users: 12, input_tokens: 1_284_000, output_tokens: 412_000, cost: 18_400, taught_count: 23 },
    accounts: [
        {
            account_seq: 103,
            account_name: "김다연",
            license_seq: 5,
            license_name: "테스트 장례식장",
            questions: 182,
            input_tokens: 420_000,
            output_tokens: 138_000,
            cost: 6_100,
            taught_count: 14,
            verified_count: 11,
            last_used_time: daysAgo(0, 9, 41),
        },
        {
            account_seq: 121,
            account_name: "박서준",
            license_seq: 5,
            license_name: "테스트 장례식장",
            questions: 97,
            input_tokens: 231_000,
            output_tokens: 74_000,
            cost: 3_300,
            taught_count: 6,
            verified_count: 4,
            last_used_time: daysAgo(1, 18, 12),
        },
        {
            account_seq: 140,
            account_name: "이현우",
            license_seq: 101,
            license_name: "본사",
            questions: 63,
            input_tokens: 148_000,
            output_tokens: 51_000,
            cost: 2_200,
            taught_count: 3,
            verified_count: 3,
            last_used_time: daysAgo(2, 13, 30),
        },
    ],
    daily: Array.from({ length: 7 }, (_, index) => ({
        date: daysAgo(6 - index).slice(0, 10),
        questions: 40 + index * 11,
        input_tokens: 120_000 + index * 18_000,
        output_tokens: 38_000 + index * 6_000,
        cost: 1_800 + index * 320,
    })),
    pricing: { input_usd_per_mtok: 3, output_usd_per_mtok: 15, usd_to_krw: 1_380 },
};

/** 가맹점(스코프) 목록 목업이다. */
export const MOCK_LICENSES = [
    { seq: 5, name: "테스트 장례식장" },
    { seq: 7, name: "두번째 장례식장" },
    { seq: 101, name: "본사" },
];

/** 이전 대화 목록 목업이다. */
export const MOCK_SESSIONS: ChatSessionSummary[] = [
    {
        seq: 3001,
        title: "빈소 재고 이동 문의",
        message_count: 4,
        last_message: "빈소 재고를 다른 빈소로 옮길 수 있나요?",
        updated_time: daysAgo(1, 14, 6),
    },
    {
        seq: 3002,
        title: "발주 알림톡 중복",
        message_count: 6,
        last_message: "같은 발주서가 두 번 왔습니다.",
        updated_time: daysAgo(2, 9, 20),
    },
];

/** 세션별 메시지 목업이다. */
export const MOCK_SESSION_MESSAGES: Record<number, ChatMessage[]> = {
    3001: [
        { role: "user", content: "빈소 재고를 다른 빈소로 옮길 수 있나요?", time: daysAgo(1, 14, 2) },
        {
            role: "assistant",
            content:
                "네, 옮길 수 있습니다.\n\n" +
                "1. **재고관리 > 빈소재고관리** 로 들어갑니다.\n" +
                "2. 옮길 상품의 실재고 숫자를 누릅니다.\n" +
                "3. 보낼 곳(다른 빈소 또는 창고)과 수량을 정하고 저장합니다.",
            knowledge_seq: 101,
            time: daysAgo(1, 14, 3),
        },
    ],
    3002: [
        { role: "user", content: "같은 발주서가 두 번 왔습니다.", time: daysAgo(2, 9, 10) },
        {
            role: "assistant",
            content: "발주 알림톡은 내용이 길면 두 통으로 나눠 보냅니다. 두 통의 내용이 이어지는지 확인해 주세요.",
            knowledge_seq: 102,
            time: daysAgo(2, 9, 11),
        },
    ],
};

/** 목업 답변 원문이다 — 질문에 따라 하나를 골라 한 글자씩 흘려보낸다. */
export const MOCK_ANSWERS: Array<{ match: RegExp; text: string; knowledgeSeq?: number; options?: Array<{ label: string; value: string }> }> = [
    {
        match: /재고|빈소/,
        text:
            "빈소 재고는 이렇게 옮깁니다.\n\n" +
            "1. **재고관리 > 빈소재고관리** 로 들어갑니다.\n" +
            "2. 옮길 상품의 실재고 숫자를 누릅니다.\n" +
            "3. 보낼 곳과 수량을 정하고 저장합니다.\n\n" +
            "| 구분 | 설명 |\n| --- | --- |\n| 기준재고 | 빈소에 채워 두는 기준 수량 |\n| 실재고 | 지금 실제로 있는 수량 |",
        knowledgeSeq: 101,
    },
    {
        match: /알림톡|발주/,
        text: "발주 알림톡은 내용이 길면 두 통으로 나눠 보냅니다.\n\n두 통의 내용이 이어지는지 먼저 확인해 주세요.",
        knowledgeSeq: 102,
        options: [
            { label: "내용이 이어져요", value: "내용이 이어집니다" },
            { label: "같은 내용이 두 번 왔어요", value: "같은 내용이 두 번 왔습니다" },
        ],
    },
    {
        match: /.*/,
        text:
            "무엇을 도와드릴까요?\n\n" +
            "아래 항목 중에서 고르시거나, 궁금한 내용을 그대로 적어 주세요.",
        options: [
            { label: "빈소 재고 옮기기", value: "빈소 재고를 옮기고 싶어요" },
            { label: "발주 알림톡 문의", value: "발주 알림톡이 두 번 왔어요" },
        ],
    },
];

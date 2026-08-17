/** 챗봇 대화 메시지/세션 타입 모음이다 (AS StoredChatMessage 와 동일 형식). */

/** 선택지 버튼 1개 */
export interface ChatOption {
    label: string; // 버튼 표시 문구
    value: string; // 클릭 시 전송될 사용자 메시지
}

/** 정정 대상 후보 1건이다. (교육자가 고칠 기존 지식) */
export interface ReplaceCandidate {
    seq: number; // 기존 지식 seq
    title: string; // 기존 제목
    content: string; // 기존 본문(펼쳐서 확인)
    score: number; // 유사도(0~1)
}

/** 대화 메시지 1건 */
export interface ChatMessage {
    role: "user" | "assistant"; // 발화 주체
    content: string; // 본문
    options?: ChatOption[]; // assistant 답변의 선택지
    selected_value?: string; // 사용자가 고른 선택지 value
    image_uuids?: string[]; // 첨부 이미지 UUID
    local_image_urls?: string[]; // 전송 직후 낙관적 말풍선 전용 미리보기(data URL) — 서버 저장본에는 없다
    replace_candidates?: ReplaceCandidate[]; // 교육자 정정 시 고칠 기존 지식 후보
    replace_draft_seq?: number; // 후보 선택 시 덮어쓸 초안 지식 seq
    knowledge_seq?: number; // 답변 근거 지식 seq
    faq_seq?: number; // 답변 근거 FAQ seq
    my_rating?: "good" | "bad"; // 이 답변에 내가 남긴 평가(서버가 세션 조회 때 얹어준다)
    time?: string; // 발화 일시
}

/** 세션 요약 (목록용) */
export interface ChatSessionSummary {
    seq: number; // 세션 seq
    title: string; // 제목
    message_count: number; // 메시지 수
    last_message?: string | null; // 마지막 메시지 요약
    updated_time?: string; // 갱신 일시
}

/** 고객센터 문의 초안 */
export interface InquiryDraft {
    title: string; // 제목
    content: string; // 본문
    image_uuids: string[]; // 첨부 후보
}

/** 스트리밍 표시 상태 */
export interface StreamingState {
    messageIndex: number; // 답변 메시지 인덱스
    text: string; // 지금까지 수신한 본문
}

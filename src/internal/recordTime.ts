/**
 * 대화 말풍선 시각 라벨 유틸이다 (패키지 내부 전용).
 *
 * 서버 시각은 이미 표시용 벽시계 값이라 Date/Intl 로 한 번 더 타임존을 먹이면 어긋난다.
 * 그래서 문자열에서 연·월·일·시·분을 그대로 떼어 쓴다.
 */

/** "방금" 으로 표시할 경과 시간 기준(ms). */
const RECENT_RECORD_LABEL_THRESHOLD_MS = 2 * 60 * 1000;

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 날짜시간 벽시계 조각이다. */
interface DateTimeParts {
    year: number;
    month: number; // 1-12
    day: number;
    hour: number;
    minute: number;
}

/** 날짜시간 문자열에서 벽시계 조각을 뽑는다(타임존 변환 없음). */
function parseDateTimeParts(value?: string): DateTimeParts | null {
    if (!value) return null;
    const match = String(value)
        .trim()
        .match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (!match) return null;
    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5]),
    };
}

/** 벽시계 조각을 epoch ms 로 바꾼다("방금" 판정용 — 같은 로컬 기준끼리 비교). */
function partsToLocalMs(parts: DateTimeParts): number {
    return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute).getTime();
}

/** HH:mm 라벨을 만든다. */
function formatTimeText(parts: DateTimeParts): string {
    return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

/** 말풍선 시각 라벨을 만든다(2분 이내는 "방금"). */
export function formatRecordTimeLabel(createdTime?: string): string {
    const parts = parseDateTimeParts(createdTime);
    if (!parts) return "--:--";

    const elapsedTime = Math.abs(Date.now() - partsToLocalMs(parts));
    if (elapsedTime <= RECENT_RECORD_LABEL_THRESHOLD_MS) return "방금";

    return formatTimeText(parts);
}

/** 날짜 구분선 라벨을 만든다("2026년 8월 17일 일요일"). */
export function formatRecordFullDateLabel(createdTime?: string): string {
    const parts = parseDateTimeParts(createdTime);
    if (!parts) return "날짜 미상";
    const weekday = WEEKDAY_LABELS[new Date(parts.year, parts.month - 1, parts.day).getDay()];
    return `${parts.year}년 ${parts.month}월 ${parts.day}일 ${weekday}요일`;
}

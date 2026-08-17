/**
 * 날짜/시간 표시 유틸이다 (패키지 내부 전용).
 *
 * 서버가 주는 날짜시간은 이미 표시용 벽시계 값("YYYY-MM-DD HH:mm:ss")이라, Date 파싱에
 * 타임존이 한 번 더 먹으면 시각이 어긋난다. 그래서 문자열은 벽시계 조각으로 직접 읽어
 * 로컬 Date 로 만든다.
 */

/** 벽시계 날짜시간 패턴 — 시/분/초는 없어도 된다. */
const WALL_CLOCK_DATE_TIME_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;

/** 눈에 안 보이는 공백/전각 콜론 등을 정리한다. */
function normalizeDateTimeInputText(value: string): string {
    return value
        .replace(/[\u200B-\u200F\uFEFF]/g, "")
        .replace(/\u00A0/g, " ")
        .replace(/\uFF1A/g, ":")
        .replace(/\s+/g, " ")
        .trim();
}

/** 날짜시간 문자열을 로컬 Date 로 파싱한다(타임존 변환 없음). 못 읽으면 Invalid Date. */
export function parseDateTime(dateTimeString: string): Date {
    const match = normalizeDateTimeInputText(dateTimeString).match(WALL_CLOCK_DATE_TIME_PATTERN);
    if (!match) return new Date(NaN);
    return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4] ?? 0),
        Number(match[5] ?? 0),
        Number(match[6] ?? 0)
    );
}

/** 문자열이면 벽시계 파싱, Date 면 그대로 쓴다. */
function resolveDateInput(dateInput: string | Date): Date {
    return typeof dateInput === "string" ? parseDateTime(dateInput) : dateInput;
}

/**
 * 날짜를 지정 형식으로 표시한다(기본 "YYYY-MM-DD").
 * 지원 토큰: YYYY / YY / MM / DD / M / D
 */
export function formatDate(dateInput: string | Date, format: string = "YYYY-MM-DD"): string {
    const date = resolveDateInput(dateInput);
    if (!dateInput || dateInput === "" || Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const yearShort = year.toString().slice(-2);

    switch (format) {
        case "YYYY-MM-DD":
            return `${year}-${month}-${day}`;
        case "YY.MM.DD":
            return `${yearShort}.${month}.${day}`;
        case "YYYYMMDD":
            return `${year}${month}${day}`;
        default:
            return format
                .replace(/YYYY/g, year.toString())
                .replace(/YY/g, yearShort)
                .replace(/MM/g, month)
                .replace(/DD/g, day)
                .replace(/M/g, (date.getMonth() + 1).toString())
                .replace(/D/g, date.getDate().toString());
    }
}

/** 날짜시간을 "YYYY-MM-DD HH:mm" 으로 표시한다(빈 값은 빈 문자열). */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
    if (!dateInput) return "";
    const date = resolveDateInput(dateInput);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (value: number) => value.toString().padStart(2, "0");
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
}

/** 날짜시간을 "M.D HH:mm" 으로 짧게 표시한다(연도 생략). */
export function formatDateTimeShort(dateInput: string | Date): string {
    const date = resolveDateInput(dateInput);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (value: number) => value.toString().padStart(2, "0");
    return `${date.getMonth() + 1}.${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

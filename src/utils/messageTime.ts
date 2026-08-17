/** 대화 메시지 일시 관련 유틸 (날짜 그룹 구분·시간 라벨). */

/** 메시지 일시에서 날짜 키("YYYY-MM-DD")를 뽑는다. 파싱 불가면 빈 문자열이다. */
export function getMessageDayKey(time?: string): string {
    const match = String(time ?? "")
        .trim()
        .match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
}

/** 앞 메시지와 날짜가 달라져 날짜 구분선을 넣어야 하는지 판정한다. */
export function shouldShowDateDivider(currentTime?: string, previousTime?: string): boolean {
    const currentDay = getMessageDayKey(currentTime);
    if (!currentDay) return false;
    return currentDay !== getMessageDayKey(previousTime);
}

/**
 * 최근 대화 목록의 일시 라벨을 만든다 — 오늘은 시각("14:30"), 지난 날은 날짜("8월 13일").
 * 해가 바뀐 대화는 연도를 함께 찍어("2025년 12월 3일") 작년 것과 헷갈리지 않게 한다.
 */
export function formatSessionTimeLabel(time?: string): string {
    const raw = String(time ?? "").trim();
    if (!raw) return "";
    // 서버 일시는 "YYYY-MM-DD HH:MM:SS" 라 Safari 가 파싱하지 못한다 — "T" 로 바꿔 로컬 시각으로 읽는다.
    const parsed = new Date(raw.replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return "";

    const today = new Date();
    const isToday =
        parsed.getFullYear() === today.getFullYear() &&
        parsed.getMonth() === today.getMonth() &&
        parsed.getDate() === today.getDate();
    if (isToday) {
        return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
    }
    const monthDay = `${parsed.getMonth() + 1}월 ${parsed.getDate()}일`;
    return parsed.getFullYear() === today.getFullYear() ? monthDay : `${parsed.getFullYear()}년 ${monthDay}`;
}

/**
 * 상담 화면 날짜 표기 — 언어별로 짓는다.
 *
 * ⚠️ 몽골어·카자흐어는 `Intl` 에 맡기지 않는다 — 크롬(안드로이드 WebView 포함)의 ICU 에 몽골어 날짜 데이터가 없어
 * 기기 언어(예: 한국어 "10월 8일")로 떨어지고, 카자흐어는 "M10 8" 처럼 반쯤만 나온다(2026-10-16 실측).
 * 영어·일본어는 어디서나 데이터가 있어 `Intl` 을 쓴다.
 */

import type { ChatbotLocale } from "./chatbotMessages";

/** 몽골어 요일 */
const MN_WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
/** 카자흐어 요일 */
const KK_WEEKDAYS = ["жексенбі", "дүйсенбі", "сейсенбі", "сәрсенбі", "бейсенбі", "жұма", "сенбі"];
/** 카자흐어 월(속격 없이 날짜 뒤에 붙는 꼴) */
const KK_MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
/** 영어·일본어 Intl 태그 */
const INTL_TAG: Partial<Record<ChatbotLocale, string>> = { en: "en-US", ja: "ja-JP" };

/** 월·일(필요하면 연도) — 한국어가 아닌 언어 전용(한국어는 부르는 쪽이 기존 표기를 쓴다) */
export function formatMonthDay(locale: ChatbotLocale, year: number, month: number, day: number, withYear: boolean): string {
    if (locale === "mn") return `${withYear ? `${year} оны ` : ""}${month}-р сарын ${day}`;
    if (locale === "kk") return `${withYear ? `${year} ж. ` : ""}${day} ${KK_MONTHS[month - 1]}`;
    const tag = INTL_TAG[locale] ?? "en-US";
    const options: Intl.DateTimeFormatOptions = withYear ? { year: "numeric", month: "short", day: "numeric" } : { month: "short", day: "numeric" };
    return new Intl.DateTimeFormat(tag, options).format(new Date(year, month - 1, day));
}

/** 연·월·일·요일(날짜 구분선) — 한국어가 아닌 언어 전용 */
export function formatFullDate(locale: ChatbotLocale, year: number, month: number, day: number): string {
    const weekday = new Date(year, month - 1, day).getDay();
    if (locale === "mn") return `${year} оны ${month}-р сарын ${day}, ${MN_WEEKDAYS[weekday]}`;
    if (locale === "kk") return `${year} ж. ${day} ${KK_MONTHS[month - 1]}, ${KK_WEEKDAYS[weekday]}`;
    const tag = INTL_TAG[locale] ?? "en-US";
    return new Intl.DateTimeFormat(tag, { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(
        new Date(year, month - 1, day),
    );
}

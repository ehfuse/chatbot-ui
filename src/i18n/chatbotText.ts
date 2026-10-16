/**
 * 상담 화면 문구를 고른다 — 언어는 `ChatbotConfig.locale`(기본 "ko")이다.
 *
 * 컴포넌트는 `useChatbotText()` 를, 컴포넌트 밖(액션·날짜 유틸·알림)은 `chatbotText()` 를 쓴다.
 * 컴포넌트 밖 값은 Provider 가 렌더할 때 모듈 등록소에 적어 둔다(요청 헤더 공급자와 같은 방식).
 */

import { CHATBOT_MESSAGES, type ChatbotLocale, type ChatbotMessages } from "./chatbotMessages";

/** 지금 언어(Provider 가 적는다) */
let currentLocale: ChatbotLocale = "ko";

/** 값이 지원하는 언어인지 */
export function isChatbotLocale(value: unknown): value is ChatbotLocale {
    return typeof value === "string" && value in CHATBOT_MESSAGES;
}

/** 모르는 값은 한국어로 떨어뜨린다. */
export function toChatbotLocale(value: unknown): ChatbotLocale {
    return isChatbotLocale(value) ? value : "ko";
}

/** 지금 언어를 적어 둔다(Provider 전용). */
export function setChatbotLocale(locale: ChatbotLocale): void {
    currentLocale = locale;
}

/** 지금 언어 */
export function getChatbotLocale(): ChatbotLocale {
    return currentLocale;
}

/** 컴포넌트 밖에서 지금 언어의 문구를 읽는다. */
export function chatbotText(): ChatbotMessages {
    return CHATBOT_MESSAGES[currentLocale];
}

/** "{n}"·"{name}" 같은 자리를 채운다. */
export function fillText(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_match, key: string) => String(values[key] ?? ""));
}

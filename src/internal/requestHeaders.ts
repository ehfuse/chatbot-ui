/**
 * 요청 헤더 공급자 등록소다 (패키지 내부 전용).
 *
 * API 함수는 컴포넌트 밖에서 호출되므로 컨텍스트를 읽을 수 없다. ChatbotProvider 가
 * 설정의 `getRequestHeaders` 를 여기 등록해 두면 API 가 그 값을 실어 보낸다
 * (스트리밍 답변을 받으려면 현재 탭의 realtime connection id 가 필요하다).
 */

/** 현재 등록된 헤더 공급자다(없으면 헤더 없이 요청한다). */
let headersGetter: (() => Record<string, string>) | null = null;

/** 헤더 공급자를 등록한다(null 이면 해제). */
export function setChatbotRequestHeadersGetter(getter: (() => Record<string, string>) | null): void {
    headersGetter = getter;
}

/** 요청에 실을 추가 헤더를 만든다(미등록이면 빈 객체). */
export function getChatbotRequestHeaders(): Record<string, string> {
    return headersGetter?.() ?? {};
}

/**
 * roleStore.ts
 *
 * 예제 화면에서 교육자/본사 여부를 토글하기 위한 아주 작은 전역 상태다.
 * (권한에 따라 근거 지식 링크·스코프 컬럼·가맹점 필터가 나타났다 사라진다)
 */

import { useSyncExternalStore } from "react";

/** 예제 권한 상태다. */
export interface ExampleRole {
    isTrainer: boolean; // 교육자 여부
    isHeadOffice: boolean; // 본사 여부
}

/** 현재 권한 값이다. */
let role: ExampleRole = { isTrainer: true, isHeadOffice: true };

/** 변경 구독자 목록이다. */
const subscribers = new Set<() => void>();

/** 구독한다(반환값 호출로 해제). */
function subscribe(listener: () => void): () => void {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
}

/** 현재 값을 읽는다. */
function getSnapshot(): ExampleRole {
    return role;
}

/** 권한 값을 바꾸고 구독자에게 알린다. */
export function setExampleRole(next: Partial<ExampleRole>): void {
    role = { ...role, ...next };
    subscribers.forEach((listener) => listener());
}

/** 현재 권한 값을 구독한다. */
export function useExampleRole(): ExampleRole {
    return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * ManageRoutePage.tsx
 *
 * 챗봇 관리 페이지의 라우트용 껍데기다 — 딥링크(`?knowledge=<seq>`) 해석까지 포함한다.
 *
 * 소비처가 라우터 훅을 뚫지 않고 그대로 라우트에 걸 수 있게, 쿼리 읽기와 정리를 여기서 한다.
 * 앱 라우터로 쿼리를 지우고 싶으면 `onInitialKnowledgeConsumed` 를 넘긴다
 * (미지정이면 history.replaceState 로 주소에서만 지운다).
 */

import { useCallback, useState } from "react";
import ChatbotManagePage from "./ManagePage";

/** 관리 라우트 페이지 props 다. */
export interface ChatbotManageRoutePageProps {
    knowledgeQueryKey?: string; // 딥링크 쿼리 키(기본 "knowledge")
    onInitialKnowledgeConsumed?: () => void; // 딥링크 소비 후 처리(미지정 시 주소에서 쿼리 제거)
}

/** 현재 주소에서 딥링크 seq 를 읽는다(브라우저 밖 환경에서는 0). */
function readKnowledgeSeq(queryKey: string): number {
    if (typeof window === "undefined") return 0;
    return Number(new URLSearchParams(window.location.search).get(queryKey) ?? 0) || 0;
}

/** 주소에서 딥링크 쿼리만 지운다(새로고침/뒤로가기에서 재오픈되지 않게). */
function stripKnowledgeQuery(queryKey: string): void {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has(queryKey)) return;
    url.searchParams.delete(queryKey);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

/** 챗봇 관리 페이지(딥링크 포함)다. 라우트에 그대로 건다. */
export default function ChatbotManageRoutePage({
    knowledgeQueryKey = "knowledge",
    onInitialKnowledgeConsumed,
}: ChatbotManageRoutePageProps = {}) {
    // 진입 시점의 쿼리만 본다 — 렌더마다 다시 읽으면 창을 닫아도 계속 다시 열린다.
    const [initialKnowledgeSeq] = useState(() => readKnowledgeSeq(knowledgeQueryKey));

    const handleConsumed = useCallback(() => {
        if (onInitialKnowledgeConsumed) {
            onInitialKnowledgeConsumed();
            return;
        }
        stripKnowledgeQuery(knowledgeQueryKey);
    }, [knowledgeQueryKey, onInitialKnowledgeConsumed]);

    return (
        <ChatbotManagePage
            initialKnowledgeSeq={initialKnowledgeSeq}
            onInitialKnowledgeConsumed={handleConsumed}
        />
    );
}

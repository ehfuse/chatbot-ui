/**
 * ChatbotHostView.tsx
 *
 * 앱 레이아웃(헤더 등)에 상주시키는 챗봇 호스트다 — 상담 드로어 + 지식 편집 창.
 *
 * 지식 편집 창이 상담 드로어와 같은 트리에 있어야 말풍선의 "사용된 지식" 링크가
 * 새 탭 대신 현재 탭에서 열린다.
 * ⚠️ 앱 전체에 하나만 마운트한다(둘이면 같은 modalId 를 두 인스턴스가 잡아 열림/닫힘이 어긋난다).
 */

import { ChatbotDrawer } from "./ChatbotDrawer";
import { KnowledgeDialogHost } from "./KnowledgeDialogHost";

/** 상담 드로어와 지식 편집 창을 함께 띄우는 상주 호스트다. */
export function ChatbotHostView() {
    return (
        <>
            <ChatbotDrawer />
            <KnowledgeDialogHost />
        </>
    );
}

/** 상담 팝업 창 예제다 — 드로어의 "새 창으로 열기" 가 이 주소를 띄운다. */

import { ChatPopupPage } from "@ehfuse/chatbot-ui";
import { ExampleChatbotProvider } from "../ExampleChatbotProvider";

/** 상담 팝업 창 페이지다. */
export function PopupPage() {
    // 별도 창이라 레이아웃의 Provider 를 물려받지 못한다 — 여기서 다시 감싼다.
    return (
        <ExampleChatbotProvider>
            <ChatPopupPage />
        </ExampleChatbotProvider>
    );
}

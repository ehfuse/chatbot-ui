import { ErrorAlert } from "@ehfuse/alerts";
import { openPopupWindow } from "../internal/popupWindow";

/** 상담 팝업 창 기본 경로 — 드로어와 같은 대화 화면을 단독 페이지로 띄운다. */
export const CHAT_POPUP_PATH = "/chatbot";

/** 상담 팝업 창 이름 — 같은 이름이라 여러 번 눌러도 창이 하나만 유지된다. */
const CHAT_POPUP_NAME = "chatbotChat";

/** 상담 대화창을 팝업 윈도우로 연다 (열려 있으면 그 창을 앞으로 가져온다). */
export function openChatPopup(path: string = CHAT_POPUP_PATH): boolean {
    const popup = openPopupWindow(path, { name: CHAT_POPUP_NAME, width: 480, height: 780 });
    if (!popup) {
        ErrorAlert("팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제해주세요.");
        return false;
    }
    return true;
}

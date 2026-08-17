import { useGlobalFormaState } from "@ehfuse/forma";
import type { ChatbotState } from "../types";
import { initialChatbotState } from "../state/defaults";
import * as Actions from "./chatbotActions";

/** 챗봇 상담 드로어 상태를 소유/공유하는 컨트롤러다. */
export function useChatbotController() {
    const state = useGlobalFormaState<ChatbotState>({
        stateId: "chatbotState",
        initialValues: initialChatbotState,
        actions: {
            loadActiveSession: Actions.loadActiveSession(),
            openSession: Actions.openSession(),
            startNewSession: Actions.startNewSession(),
            openSessionList: Actions.openSessionList(),
            removeSession: Actions.removeSession(),
            sendMessage: Actions.sendMessage(),
            submitInquiry: Actions.submitInquiry(),
        },
        watch: {
            // 드로어가 열릴 때 진행중 세션을 로드한다 (세션 없으면 빈 대화).
            isDrawerOpen: (ctx, value) => {
                if (value === true && ctx.getValue("conversationSeq") == null) {
                    void Actions.loadActiveSession()(ctx);
                }
            },
        },
    });

    return { state };
}

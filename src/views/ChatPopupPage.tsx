import { useEffect } from "react";
import { Box } from "@mui/material";
import { useChatbotController } from "../controllers/chatbotController";
import { ChatPanel } from "./ChatPanel";

/** 상담 대화창을 단독 페이지로 띄우는 팝업 창 화면이다 (드로어와 같은 패널을 쓴다). */
export default function ChatPopupPage() {
    const { state } = useChatbotController();

    // 팝업 창은 대화 화면이 항상 떠 있는 상태다. isDrawerOpen 을 켜면 세션 로드(watch)와
    // 입력 포커스/맨아래 스크롤(ChatInput·MessageList)이 드로어와 동일하게 동작한다.
    useEffect(() => {
        document.title = "상담하기";
        state.setValue("isDrawerOpen", true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box
            sx={{
                height: "100dvh",
                display: "flex",
                flexDirection: "column",
                bgcolor: "#ffffff",
                overflow: "hidden",
            }}
        >
            <ChatPanel />
        </Box>
    );
}

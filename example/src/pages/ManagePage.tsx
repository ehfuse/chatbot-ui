/** 챗봇 관리 5탭 예제다. */

import { Box } from "@mui/material";
import { ChatbotManageRoutePage } from "@ehfuse/chatbot-ui";

/** 챗봇 관리 예제 페이지다. */
export function ManagePage() {
    // 관리 화면은 목록이 세로를 꽉 채우는 구조라 높이 체인을 이어 준다.
    return (
        <Box sx={{ height: "100%", minHeight: 0 }}>
            <ChatbotManageRoutePage />
        </Box>
    );
}

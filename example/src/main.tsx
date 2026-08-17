import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { GlobalFormaProvider } from "@ehfuse/forma";
import { App } from "./App";

/** 예제 테마다 — 한글 본문이 읽히도록 글꼴만 맞춰 둔다. */
const theme = createTheme({
    typography: {
        fontFamily: `Pretendard, "Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif`,
    },
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {/* 챗봇 UI 의 전역 상태(chatbotState·chatbotManageState)는 forma 가 소유한다 —
                이 Provider 가 없으면 컨트롤러 훅이 바로 예외를 던진다. */}
            <GlobalFormaProvider storagePrefix="chatbot-ui-example">
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </GlobalFormaProvider>
        </ThemeProvider>
    </StrictMode>
);

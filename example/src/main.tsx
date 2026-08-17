import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
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
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>
);

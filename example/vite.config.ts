import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // 빌드된 dist 가 아니라 소스를 보게 해 수정이 즉시 반영되게 한다.
            "@ehfuse/chatbot-ui": path.resolve(__dirname, "../src"),
            // 예제에는 앱 서버가 없으므로 API/realtime 을 메모리 목업으로 갈아끼운다.
            "entity-client": path.resolve(__dirname, "src/mocks/entityClient.ts"),
        },
        // 예제와 패키지 소스가 서로 다른 react/mui 사본을 잡으면 훅이 깨진다 — 하나로 묶는다.
        dedupe: [
            "react",
            "react-dom",
            "@mui/material",
            "@mui/icons-material",
            "@emotion/react",
            "@emotion/styled",
            "@ehfuse/forma",
        ],
    },
    server: {
        port: 5183,
    },
});

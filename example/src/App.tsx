/**
 * App.tsx
 *
 * 예제 라우터다. 왼쪽 목록에서 예제 페이지를 고른다.
 * 상담 팝업 창(/popup)만 레이아웃 없이 단독으로 뜬다(실제 앱의 별도 창과 같은 모양).
 */

import { Route, Routes } from "react-router-dom";
import { ExampleLayout } from "./ExampleLayout";
import { HomePage } from "./pages/HomePage";
import { ChatPage } from "./pages/ChatPage";
import { ManagePage } from "./pages/ManagePage";
import { PopupPage } from "./pages/PopupPage";
import { KnowledgeDialogPage } from "./pages/KnowledgeDialogPage";

/** 예제 라우터다. */
export function App() {
    return (
        <Routes>
            {/* 팝업 창은 앱 껍데기 없이 대화만 채운다. */}
            <Route path="/popup" element={<PopupPage />} />
            <Route element={<ExampleLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/manage" element={<ManagePage />} />
                <Route path="/knowledge-dialog" element={<KnowledgeDialogPage />} />
            </Route>
        </Routes>
    );
}

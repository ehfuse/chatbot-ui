/**
 * 대화 첨부 이미지를 크게 여는 훅이다.
 *
 * 앱이 전역 파일 뷰어를 가지고 있으면 `openImageViewer` 로 주입받아 인앱 확대(회전/다운로드)를 쓰고,
 * 없으면 새 탭으로 원본을 연다. 상담 팝업 창에는 앱의 전역 뷰어 호스트가 없으므로,
 * `buildFileViewerUrl` 이 주입돼 있으면 뷰어 전용 탭 주소로 대신 연다.
 */

import { useCallback } from "react";
import { useChatbotConfig } from "../ChatbotProvider";
import { CHAT_POPUP_PATH } from "./chatPopup";

/** 파일 주소에서 uuid 를 뽑는다. (`/api/v1/files/<uuid>` 형태만 대상 — data URL 등은 null) */
function extractFileUuid(src: string): string | null {
    const match = /\/v1\/files\/([^/?#]+)/.exec(src);
    return match ? match[1] : null;
}

/** 대화 첨부 이미지를 크게 여는 핸들러를 돌려준다. */
export function useChatImageViewer(): (src: string, index: number) => void {
    const { openImageViewer, buildFileViewerUrl, chatPopupPath } = useChatbotConfig();
    const popupPath = chatPopupPath ?? CHAT_POPUP_PATH;

    return useCallback(
        (src: string, index: number) => {
            const name = `상담-첨부-${index + 1}.webp`;

            // 팝업 창에는 전역 뷰어 호스트가 없어 인앱 확대가 안 된다 — 뷰어 전용 탭으로 대신 연다.
            if (window.location.pathname.startsWith(popupPath)) {
                const uuid = buildFileViewerUrl ? extractFileUuid(src) : null;
                // 아직 업로드 전(로컬 data URL)이라 uuid 가 없으면 원본을 새 탭으로 연다.
                window.open(uuid ? buildFileViewerUrl!(uuid, name) : src, "_blank", "noopener");
                return;
            }

            if (openImageViewer) {
                openImageViewer(src, index);
                return;
            }

            window.open(src, "_blank", "noopener");
        },
        [buildFileViewerUrl, openImageViewer, popupPath]
    );
}

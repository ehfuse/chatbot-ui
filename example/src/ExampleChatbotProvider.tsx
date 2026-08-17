/**
 * ExampleChatbotProvider.tsx
 *
 * 예제용 설정 주입기다 — 실제 앱이라면 로그인 스토어·라우터·파일 뷰어를 이어 붙일 자리를,
 * 목업 계정과 간단한 콜백으로 채운다.
 *
 * 교육자/본사 여부는 화면 위 스위치로 바꿀 수 있게 해서 권한별 UI 차이를 바로 볼 수 있게 했다.
 */

import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChatbotProvider, type ChatbotConfig } from "@ehfuse/chatbot-ui";
import { useExampleRole } from "./roleStore";

/** 예제 본사 라이선스 seq 다. */
const HEAD_OFFICE_LICENSE_SEQ = 101;

/** 예제 설정을 주입한다. */
export function ExampleChatbotProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const { isTrainer, isHeadOffice } = useExampleRole();

    const config = useMemo<ChatbotConfig>(
        () => ({
            account: {
                seq: 103,
                name: "김다연",
                license_seq: isHeadOffice ? HEAD_OFFICE_LICENSE_SEQ : 5,
                is_trainer: isTrainer,
            },
            isTrainer,
            isHeadOffice,
            headOfficeLicenseSeq: HEAD_OFFICE_LICENSE_SEQ,
            navigate: (path: string) => navigate(path),
            // 첨부 확대는 앱 뷰어 대신 새 탭으로 둔다(주입하지 않으면 패키지 기본 동작과 같다).
            buildSourcePostUrl: (postSeq: number) => `/qna/${postSeq}`,
            chatPopupPath: "/popup",
        }),
        [isHeadOffice, isTrainer, navigate]
    );

    return <ChatbotProvider config={config}>{children}</ChatbotProvider>;
}

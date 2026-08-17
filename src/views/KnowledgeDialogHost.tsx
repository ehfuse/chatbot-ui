/**
 * KnowledgeDialogHost.tsx
 *
 * 지식 편집 다이얼로그의 전역 호스트다. (대시보드 헤더에 상주)
 *
 * 상담 드로어의 "사용된 지식" 링크를 새 탭 대신 현재 탭에서 열기 위해 둔다.
 * 챗봇 관리 페이지도 이 호스트가 띄운 하나를 함께 쓰므로, 페이지에서 따로 마운트하지 않는다
 * (이중 마운트하면 같은 modalId 를 두 인스턴스가 잡아 열림/닫힘이 어긋난다).
 */
import { useEffect } from "react";
import { useIsHeadOffice, useIsTrainer } from "../ChatbotProvider";
import { useChatbotManageController } from "../controllers/manageController";
import { KnowledgeDialog } from "./manage/dialogs/KnowledgeDialog";
import { registerKnowledgeDialogOpener } from "../utils/knowledgeDialogHost";

/** 교육자에게만 마운트되는 실제 호스트다. (컨트롤러 훅을 조건부로 부를 수 없어 분리한다) */
function KnowledgeDialogHostInner({ isHeadOffice }: { isHeadOffice: boolean }) {
    const controller = useChatbotManageController();
    const { openKnowledgeBySeq } = controller;

    // 말풍선 링크가 부를 수 있도록 열기 함수를 등록한다.
    useEffect(() => {
        return registerKnowledgeDialogOpener((seq) => {
            void openKnowledgeBySeq(seq);
        });
        // controller 는 매 렌더 새 객체라 참조 고정 — 마운트/언마운트에서만 등록·해제한다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <KnowledgeDialog controller={controller} isTrainer isHeadOffice={isHeadOffice} />;
}

/** 지식 편집 다이얼로그 전역 호스트다. */
export function KnowledgeDialogHost() {
    const isTrainer = useIsTrainer();
    const isHeadOffice = useIsHeadOffice();
    if (!isTrainer) return null;
    return <KnowledgeDialogHostInner isHeadOffice={isHeadOffice} />;
}

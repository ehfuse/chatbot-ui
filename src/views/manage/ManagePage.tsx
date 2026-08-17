/**
 * ManagePage.tsx
 *
 * 챗봇 관리 페이지다 — 지식 / 지식 후보 / 답변 피드백 / 분석 / 사용현황 5개 탭으로 구성한다.
 * 교육자만 접근할 수 있다(서버도 requireTrainer 로 403 차단).
 *
 * 딥링크로 특정 지식을 바로 열려면 `initialKnowledgeSeq` 를 넘기고, 한 번 연 뒤
 * 쿼리를 지우는 처리는 소비처가 `onInitialKnowledgeConsumed` 에서 한다
 * (라우터를 패키지가 알 필요가 없게 한다).
 */
import { useEffect, useMemo } from "react";
import { Box, Paper } from "@mui/material";
import { useIsHeadOffice, useIsTrainer } from "../../ChatbotProvider";
import { useChatbotManageController } from "../../controllers/manageController";
import { KnowledgeTab } from "./tabs/KnowledgeTab";
import { CandidateTab } from "./tabs/CandidateTab";
import { FeedbackTab } from "./tabs/FeedbackTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";
import { UsageTab } from "./tabs/UsageTab";
import { ManageTabs } from "./components/ManageTabs";
import { manageTabPanelSx } from "./components/manageTableStyles";

/** 탭 라벨 목록이다. */
const TAB_LABELS = ["지식", "지식 후보", "답변 피드백", "분석", "사용현황"];

/** 챗봇 관리 페이지 props 다. */
export interface ChatbotManagePageProps {
    initialKnowledgeSeq?: number; // 진입 시 바로 열 지식 seq(딥링크)
    onInitialKnowledgeConsumed?: () => void; // 딥링크를 소비한 뒤 호출된다(쿼리 정리용)
}

/** 챗봇 관리 페이지 컴포넌트다. */
export default function ChatbotManagePage({
    initialKnowledgeSeq,
    onInitialKnowledgeConsumed,
}: ChatbotManagePageProps = {}) {
    const isTrainer = useIsTrainer();
    const isHeadOffice = useIsHeadOffice();

    const controller = useChatbotManageController();
    const { state } = controller;
    const tabRaw = state.useValue("tab") as number | undefined;
    const tab = tabRaw ?? 0;

    // 탭 라벨 뒤 건수 — 지식은 필터와 무관한 전체(폐기·후보 제외), 후보/피드백은 불러온 목록 길이다.
    // 분석·사용현황 탭은 셀 대상이 없어 숫자를 붙이지 않는다(null).
    const knowledgeCountRaw = state.useValue("knowledgeTabCount") as number | undefined;
    const candidateCountRaw = state.useValue("candidateTabCount") as number | undefined;
    const feedbackCountRaw = state.useValue("feedbackTabCount") as number | undefined;
    const tabCounts = useMemo(
        () => [knowledgeCountRaw ?? 0, candidateCountRaw ?? 0, feedbackCountRaw ?? 0, null, null],
        [knowledgeCountRaw, candidateCountRaw, feedbackCountRaw]
    );

    // 탭 배지 숫자는 처음 들어올 때 한 번 모두 채운다 —
    // 탭을 열어야만 세면 방문 전에는 (0) 으로 보여 오해를 준다.
    useEffect(() => {
        if (!isTrainer) return;
        state.actions.loadTabCounts();
        // state 인스턴스는 전역 공유라 참조 고정 — 교육자 판정 변화에만 반응한다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTrainer]);

    // 딥링크(?knowledge=<seq>) — 진입 시 해당 지식/후보 편집 다이얼로그를 바로 연다.
    useEffect(() => {
        if (!isTrainer || !initialKnowledgeSeq) return;
        void controller.openKnowledgeBySeq(initialKnowledgeSeq);
        // 한 번 열었으면 소비처가 쿼리를 지워 새로고침/뒤로가기에서 재오픈되지 않게 한다.
        onInitialKnowledgeConsumed?.();
        // controller 는 매 렌더 새 객체라 참조 고정 — 딥링크/권한 변화에만 반응한다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialKnowledgeSeq, isTrainer]);

    // 탭 진입/전환 시 해당 탭 데이터를 조회한다. (권한 없으면 호출하지 않는다)
    useEffect(() => {
        if (!isTrainer) return;
        if (tab === 0) state.actions.loadKnowledge();
        else if (tab === 1) state.actions.loadCandidates();
        else if (tab === 2) state.actions.loadFeedback();
        else if (tab === 3) state.actions.loadAnalytics();
        else if (tab === 4) state.actions.loadUsage();
        // state 인스턴스는 전역 공유라 참조 고정 — 탭/권한 변화에만 반응한다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, isTrainer]);

    // 교육자가 아니면 안내만 표시한다. (서버도 403 으로 차단한다)
    if (!isTrainer) {
        return (
            <Paper style={{ padding: "1rem" }}>
                <Box sx={{ py: 4, textAlign: "center", fontSize: "14.5px", color: "#111827" }}>
                    챗봇 관리는 교육자만 사용할 수 있습니다.
                </Box>
            </Paper>
        );
    }

    return (
        <Paper
            sx={{
                p: 2,
                bgcolor: "#ffffff",
                // 목록이 화면 세로를 꽉 채우도록 높이 체인을 잇는다(업무함과 동일 — 안 이으면 목록이 중간에서 끊긴다).
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: 0,
            }}
        >
            {/* 업무함 스타일 상단 탭 — 아래 표 테두리 박스 위에 얹힌다(선택 시 검정 배경 + 흰 글씨). */}
            <ManageTabs
                labels={TAB_LABELS}
                counts={tabCounts}
                value={tab}
                onChange={(next) => state.setValue("tab", next)}
            />

            {/* 탭과 이어지는 테두리 박스 — 활성 탭의 필터/표를 감싼다(업무함 표 규칙). */}
            <Box sx={{ ...manageTabPanelSx, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                {tab === 0 ? <KnowledgeTab controller={controller} isHeadOffice={isHeadOffice} /> : null}
                {tab === 1 ? <CandidateTab controller={controller} /> : null}
                {tab === 2 ? <FeedbackTab controller={controller} /> : null}
                {tab === 3 ? (
                    <AnalyticsTab controller={controller} isHeadOffice={isHeadOffice} isTrainer={isTrainer} />
                ) : null}
                {tab === 4 ? <UsageTab controller={controller} isHeadOffice={isHeadOffice} /> : null}
            </Box>

            {/* 지식 편집 다이얼로그는 앱에 상주하는 KnowledgeDialogHost 가 전역으로 하나만 띄운다.
                여기서 또 마운트하면 같은 modalId 를 두 인스턴스가 잡아 열림/닫힘이 어긋난다. */}
        </Paper>
    );
}

/**
 * FeedbackTab.tsx
 *
 * 챗봇 관리 > 답변 피드백 탭.
 * 평가(전체/좋아요/아쉬워요) 필터와 질문/답변 스냅샷 목록을 표시하고,
 * 사용 지식 seq 클릭 시 해당 지식 편집 다이얼로그를 연다.
 */
import { useCallback } from "react";
import { Box, Button, IconButton, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { ConfirmDialog } from "@ehfuse/alerts";
import { formatDateTime } from "../../../internal/dateUtils";
import { TrashIcon } from "../../../internal/icons";
import type { useChatbotManageController } from "../../../controllers/manageController";
import type { FeedbackRow } from "../../../types/manage";
import { RatingChip } from "../components/KnowledgeChips";
import { ManageFilterSwitch } from "../components/ManageFilterSwitch";
import { ManageTabScroll } from "../components/ManageTabScroll";
import {
    manageBodyCellSx,
    manageBodyRowSx,
    manageFilterRowSx,
    manageHeadCellSx,
    manageTableSx,
} from "../components/manageTableStyles";

/** 답변 피드백 탭 props 타입이다. */
interface FeedbackTabProps {
    controller: ReturnType<typeof useChatbotManageController>; // 챗봇 관리 컨트롤러
}

/** 평가 필터 옵션이다. */
const RATING_OPTIONS = [
    { value: "all", label: "전체" },
    { value: "bad", label: "👎 아쉬워요" },
    { value: "good", label: "👍 좋아요" },
];

/** 긴 스냅샷 텍스트를 말줄임 한 줄로 표시한다. */
function SnapshotCellText({ text }: { text: string }) {
    return (
        <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={text}>
            {text || "-"}
        </Box>
    );
}

/** 챗봇 관리 답변 피드백 탭 컴포넌트다. */
export function FeedbackTab({ controller }: FeedbackTabProps) {
    const { state, openKnowledgeBySeq, openKnowledgeCreate, deleteFeedback } = controller;
    const itemsRaw = state.useValue("feedbackItems") as FeedbackRow[] | undefined;
    const items = itemsRaw || [];
    const ratingRaw = state.useValue("feedbackRating") as "all" | "good" | "bad" | undefined;
    const rating = ratingRaw || "bad";

    /** 평가 필터 변경 시 목록을 재조회한다. */
    const handleRatingChange = useCallback(
        (value: string) => {
            state.setValue("feedbackRating", value as "all" | "good" | "bad");
            state.actions.loadFeedback();
        },
        [state]
    );

    /** 처리 끝난 피드백을 목록에서 치운다. (지식은 건드리지 않는다) */
    const handleDelete = useCallback(
        async (seq: number) => {
            const confirmed = await ConfirmDialog({
                title: "피드백 삭제",
                message: "이 피드백을 목록에서 삭제하시겠습니까?",
                confirmText: "삭제",
                cancelText: "취소",
            });
            if (!confirmed) return;
            await deleteFeedback(seq);
        },
        [deleteFeedback]
    );

    return (
        <ManageTabScroll
            toolbar={
                /* 필터 영역 — 표 위 툴바 행(업무함 툴바 규칙) */
                <Box sx={manageFilterRowSx}>
                    {/* 평가 필터 — 업무함 보기 스위처처럼 텍스트 버튼 나열(선택만 강조) */}
                    <ManageFilterSwitch options={RATING_OPTIONS} value={rating} onChange={handleRatingChange} />
                </Box>
            }
        >
            {/* 피드백 목록 테이블 */}
            <Box sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 940, ...manageTableSx }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ ...manageHeadCellSx, width: 150 }} align="center">
                                일시
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 120 }} align="center">
                                평가
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 110 }} align="center">
                                평가자
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: "30%" }}>질문</TableCell>
                            <TableCell sx={manageHeadCellSx}>답변</TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 110 }} align="center">
                                사용 지식
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 100 }} align="center">
                                등록
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 70 }} align="center">
                                삭제
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* 재조회 중에도 기존 렌더를 유지한다 — 스피너 행을 두지 않아 조회마다 깜빡이지 않는다. */}
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ ...manageBodyCellSx, py: 4 }}>
                                    표시할 피드백이 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((row) => (
                                <TableRow key={row.seq} sx={manageBodyRowSx}>
                                    <TableCell sx={manageBodyCellSx} align="center">
                                        {row.created_time ? formatDateTime(row.created_time) : "-"}
                                    </TableCell>
                                    <TableCell sx={manageBodyCellSx} align="center">
                                        <RatingChip rating={row.rating} />
                                    </TableCell>
                                    <TableCell sx={manageBodyCellSx} align="center">
                                        {row.rater_name || "-"}
                                    </TableCell>
                                    <TableCell sx={{ ...manageBodyCellSx, maxWidth: 0 }}>
                                        <SnapshotCellText text={row.question_snapshot} />
                                    </TableCell>
                                    <TableCell sx={{ ...manageBodyCellSx, maxWidth: 0 }}>
                                        <SnapshotCellText text={row.answer_snapshot} />
                                    </TableCell>
                                    <TableCell sx={manageBodyCellSx} align="center">
                                        {row.knowledge_seq ? (
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => openKnowledgeBySeq(Number(row.knowledge_seq))}
                                                sx={{ fontSize: "13.5px", fontWeight: 600 }}
                                            >
                                                #{row.knowledge_seq}
                                            </Button>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    {/* 근거 지식이 없었거나(답 못함) 엉뚱한 지식이 잡힌 경우 모두 새 지식이 필요하다.
                                        그래서 사용 지식 유무와 상관없이 등록 버튼을 항상 둔다(질문을 제목으로 프리필). */}
                                    <TableCell sx={manageBodyCellSx} align="center">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => openKnowledgeCreate(row.question_snapshot ?? "")}
                                            sx={{ fontSize: "13.5px", whiteSpace: "nowrap" }}
                                        >
                                            등록
                                        </Button>
                                    </TableCell>
                                    {/* 처리를 끝낸 피드백을 목록에서 치운다 — 지식은 그대로 두고 이 평가 기록만 지운다. */}
                                    <TableCell sx={manageBodyCellSx} align="center">
                                        <IconButton
                                            size="small"
                                            title="이 피드백을 목록에서 삭제"
                                            onClick={() => handleDelete(Number(row.seq))}
                                            sx={{ color: "#b91c1c" }}
                                        >
                                            <TrashIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Box>
        </ManageTabScroll>
    );
}

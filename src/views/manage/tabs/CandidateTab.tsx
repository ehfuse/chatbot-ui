/**
 * CandidateTab.tsx
 *
 * 챗봇 관리 > 지식 후보 탭.
 * status=candidate 지식(답 못한 질문/사용자 제보)을 나열하고, 행 클릭으로 편집 후 승인/폐기한다.
 */
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { formatDate } from "../../../internal/dateUtils";
import type { useChatbotManageController } from "../../../controllers/manageController";
import type { KnowledgeRow } from "../../../types/manage";
import { ReasonChip } from "../components/KnowledgeChips";
import { ManageTabScroll } from "../components/ManageTabScroll";
import {
    manageBodyCellSx,
    manageBodyRowSx,
    manageHeadCellSx,
    manageTableSx,
} from "../components/manageTableStyles";

/** 지식 후보 탭 props 타입이다. */
interface CandidateTabProps {
    controller: ReturnType<typeof useChatbotManageController>; // 챗봇 관리 컨트롤러
}

/** 챗봇 관리 지식 후보 탭 컴포넌트다. */
export function CandidateTab({ controller }: CandidateTabProps) {
    const { state, openKnowledgeDialog } = controller;
    const itemsRaw = state.useValue("candidateItems") as KnowledgeRow[] | undefined;
    const items = itemsRaw || [];

    return (
        <ManageTabScroll>
            <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 640, ...manageTableSx }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ ...manageHeadCellSx, width: 140 }} align="center">
                            사유
                        </TableCell>
                        <TableCell sx={manageHeadCellSx}>제목</TableCell>
                        <TableCell sx={{ ...manageHeadCellSx, width: 110 }} align="center">
                            질문자
                        </TableCell>
                        <TableCell sx={{ ...manageHeadCellSx, width: 120 }} align="center">
                            등록일
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {/* 재조회 중에도 기존 렌더를 유지한다 — 스피너 행을 두지 않아 조회마다 깜빡이지 않는다. */}
                    {items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ ...manageBodyCellSx, py: 4 }}>
                                검토할 지식 후보가 없습니다.
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((row) => (
                            <TableRow
                                key={row.seq}
                                onClick={() => openKnowledgeDialog(row)}
                                sx={{ ...manageBodyRowSx, cursor: "pointer" }}
                            >
                                <TableCell sx={manageBodyCellSx} align="center">
                                    <ReasonChip reason={row.candidate_reason} />
                                </TableCell>
                                <TableCell sx={{ ...manageBodyCellSx, fontWeight: 500 }}>
                                    <Box
                                        sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                        title={row.title}
                                    >
                                        {row.title}
                                    </Box>
                                </TableCell>
                                <TableCell sx={manageBodyCellSx} align="center">
                                    {row.asker_name || "-"}
                                </TableCell>
                                <TableCell sx={manageBodyCellSx} align="center">
                                    {row.created_time ? formatDate(row.created_time) : "-"}
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

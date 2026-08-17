/**
 * AnalyticsTab.tsx
 *
 * 챗봇 관리 > 분석 탭.
 * 기간 선택(기본 최근 30일) 통계 카드 6개와 지식 갭 리포트 목록을 표시한다.
 * 101(본사) 로그인 시 가맹점 필터를 추가로 제공한다.
 */
import { useCallback, useState } from "react";
import {
    Box,
    Button,
    ButtonBase,
    Chip,
    Popover,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { SearchTextField } from "@ehfuse/mui-form-controls";
import { TaskDateRangeFilter } from "@ehfuse/taskbox";
import { formatDateTime } from "../../../internal/dateUtils";
import { ManageStatCard, type StatTone } from "../components/ManageStatCard";
import { ManageTabScroll } from "../components/ManageTabScroll";
import type { useChatbotManageController } from "../../../controllers/manageController";
import type { ChatbotStats, GapRow } from "../../../types/manage";
import {
    MANAGE_COLORS,
    manageBodyCellSx,
    manageBodyRowSx,
    manageFilterRowSx,
    manageHeadCellSx,
    manageRangeButtonSx,
    manageTableSx,
} from "../components/manageTableStyles";

/** 날짜 문자열이 자동 재조회 가능한 값(완성된 날짜 또는 빈값)인지 판정한다. */
function isReloadableDate(value: string): boolean {
    return value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** 분석 탭 props 타입이다. */
interface AnalyticsTabProps {
    controller: ReturnType<typeof useChatbotManageController>; // 챗봇 관리 컨트롤러
    isHeadOffice: boolean; // 본사 로그인 여부 — 가맹점 필터 노출
    isTrainer: boolean; // 교육자 여부 — "지식으로 등록" 버튼 노출
}

/** 통계 응답을 카드 6개(라벨/값/색)로 변환한다. */
function buildStatCards(stats: ChatbotStats | null): Array<{ label: string; value: string; tone: StatTone }> {
    const sessions = Number(stats?.sessions) || 0;
    const resolved = Number(stats?.resolvedSessions) || 0;
    const good = Number(stats?.goodCount) || 0;
    const bad = Number(stats?.badCount) || 0;
    const resolveRate = sessions > 0 ? `${Math.round((resolved / sessions) * 100)}%` : "-";
    const goodRate = good + bad > 0 ? `${Math.round((good / (good + bad)) * 100)}%` : "-";
    // 색은 지표 성격에 맞춘다 — 규모(파랑), 성과(초록), 살펴봐야 할 값(주황/빨강).
    return [
        { label: "상담 세션", value: sessions.toLocaleString(), tone: { bg: "#eff6ff", fg: "#1d4ed8" } },
        { label: "총 턴", value: (Number(stats?.turns) || 0).toLocaleString(), tone: { bg: "#eef2ff", fg: "#4338ca" } },
        { label: "자동 해결률", value: resolveRate, tone: { bg: "#ecfdf5", fg: "#047857" } },
        {
            label: "이관 건수",
            value: (Number(stats?.escalations) || 0).toLocaleString(),
            tone: { bg: "#fff7ed", fg: "#c2410c" },
        },
        { label: "👍 비율", value: goodRate, tone: { bg: "#f0fdf4", fg: "#15803d" } },
        {
            label: "저확신 턴",
            value: (Number(stats?.lowConfidenceTurns) || 0).toLocaleString(),
            tone: { bg: "#fef2f2", fg: "#b91c1c" },
        },
    ];
}

/** 챗봇 관리 분석 탭 컴포넌트다. */
export function AnalyticsTab({ controller, isHeadOffice, isTrainer }: AnalyticsTabProps) {
    const { state, openKnowledgeCreate } = controller;
    const statsFromRaw = state.useValue("statsFrom") as string | undefined;
    const statsFrom = statsFromRaw || "";
    const statsToRaw = state.useValue("statsTo") as string | undefined;
    const statsTo = statsToRaw || "";
    const statsLicenseSeqRaw = state.useValue("statsLicenseSeq") as string | undefined;
    const statsLicenseSeq = statsLicenseSeqRaw || "";
    const statsRaw = state.useValue("stats") as ChatbotStats | null | undefined;
    const stats = statsRaw ?? null;
    const gapItemsRaw = state.useValue("gapItems") as GapRow[] | undefined;
    const gapItems = gapItemsRaw || [];
    // 기간 선택 팝오버 anchor (null 이면 닫힘)
    const [rangeAnchorEl, setRangeAnchorEl] = useState<HTMLElement | null>(null);

    /** 기간 변경 — 상태를 갱신하고, 완성된 날짜(또는 빈값)면 자동 재조회한다. */
    const handleRangeChange = useCallback(
        (fromDate: string, toDate: string) => {
            state.setValue("statsFrom", fromDate);
            state.setValue("statsTo", toDate);
            // 직접 입력 중간값(부분 날짜)으로는 조회하지 않는다.
            if (isReloadableDate(fromDate) && isReloadableDate(toDate)) state.actions.loadAnalytics();
        },
        [state]
    );

    /** 가맹점 필터 검색/초기화 — 현재 필터로 통계·갭 리포트를 재조회한다. */
    const handleLicenseSearch = useCallback(() => {
        state.actions.loadAnalytics();
    }, [state.actions]);

    const cards = buildStatCards(stats);
    // 기간 버튼 라벨 — 현재 기간을 그대로 보여준다(둘 다 비면 전체).
    const hasRange = Boolean(statsFrom || statsTo);
    const rangeLabel = hasRange ? `${statsFrom || "처음"} ~ ${statsTo || "오늘"}` : "기간 (전체)";

    return (
        <ManageTabScroll
            toolbar={
                <>
                {/* 가맹점/기간 필터 — 표 위 툴바 행(업무함 툴바 규칙). 조회 버튼 없이 변경 시 자동 재조회한다. */}
                <Box sx={{ ...manageFilterRowSx, gap: 1.5 }}>
                    {isHeadOffice ? (
                        <SearchTextField
                            size="small"
                            placeholder="검색어를 입력하세요"
                            value={statsLicenseSeq}
                            onChange={(e) => state.setValue("statsLicenseSeq", e.target.value)}
                            onSearch={handleLicenseSearch}
                            onClear={() => {
                                state.setValue("statsLicenseSeq", "");
                                state.actions.loadAnalytics();
                            }}
                            sx={{ width: 300 }}
                        />
                    ) : null}
                    {/* 기간 버튼 — 업무함 기간 필터와 동일한 버튼+팝오버(퀵버튼/직접입력) 패턴 */}
                    <ButtonBase onClick={(event) => setRangeAnchorEl(event.currentTarget)} sx={manageRangeButtonSx(hasRange)}>
                        <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />
                        {rangeLabel}
                    </ButtonBase>
                </Box>

    {/* 기간 선택 팝오버 — 업무함 TaskDateRangeFilter(1개월/3개월/6개월/1년/전체 + 직접입력) 재사용 */}
                <Popover
                    transitionDuration={0}
                    anchorEl={rangeAnchorEl}
                    open={Boolean(rangeAnchorEl)}
                    onClose={() => setRangeAnchorEl(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    slotProps={{ paper: { sx: { p: 1.5 } } }}
                >
                    <TaskDateRangeFilter fromDate={statsFrom} toDate={statsTo} onChange={handleRangeChange} />
                </Popover>

                {/* 통계 카드 6개 */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" },
                        gap: 1.5,
                        p: 1.5,
                    }}
                >
                    {cards.map((card) => (
                        <ManageStatCard key={card.label} label={card.label} value={card.value} tone={card.tone} />
                    ))}
                </Box>

                {/* 지식 갭 리포트 */}
                <Typography
                    sx={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#111827",
                        px: 1.5,
                        pb: 1,
                        // 표 상단선 역할 — 고정 영역에 그려야 스크롤해도 남는다(sticky th 테두리는 따라오지 않는다).
                        borderBottom: `1px solid ${MANAGE_COLORS.borderStrong}`,
                    }}
                >
                    지식 갭 리포트
                </Typography>
                </>
            }
        >
            {/* 표만 스크롤한다 — 요약 카드는 위 고정 영역, th 는 sticky 로 상단에 붙는다.
                여기에 overflowX 를 걸면 이 Box 가 새 스크롤 기준이 되어 sticky th 가 동작하지 않는다
                (가로 스크롤은 바깥 OverlayScrollbar 가 맡는다). 표 상단선은 위 고정 영역이 그린다. */}
            <Box>
                <Table size="small" sx={{ minWidth: 720, ...manageTableSx }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={manageHeadCellSx}>질문 요약</TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 110 }} align="center">
                                질문자
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 150 }}>일시</TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 150 }} align="center">
                                확신도 / 이관
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 130 }} align="center">
                                &nbsp;
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {gapItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ ...manageBodyCellSx, py: 4 }}>
                                    지식 갭 리포트가 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            gapItems.map((row) => (
                                <TableRow key={row.seq} sx={manageBodyRowSx}>
                                    <TableCell sx={{ ...manageBodyCellSx, maxWidth: 0 }}>
                                        <Box
                                            sx={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                            title={row.question_summary}
                                        >
                                            {row.question_summary || "-"}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={manageBodyCellSx} align="center">
                                        {row.asker_name || "-"}
                                    </TableCell>
                                    <TableCell sx={manageBodyCellSx}>
                                        {row.asked_time ? formatDateTime(row.asked_time) : "-"}
                                    </TableCell>
                                    <TableCell sx={manageBodyCellSx} align="center">
                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: 0.5,
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Chip
                                                label={`${Math.round((Number(row.confidence) || 0) * 100)}%`}
                                                size="small"
                                                sx={{
                                                    bgcolor: "#ffedd5",
                                                    color: "#9a3412",
                                                    fontSize: "13.5px",
                                                    fontWeight: 600,
                                                }}
                                            />
                                            {row.escalated ? (
                                                <Chip
                                                    label="이관"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "#fee2e2",
                                                        color: "#991b1b",
                                                        fontSize: "13.5px",
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            ) : null}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={manageBodyCellSx} align="center">
                                        {isTrainer ? (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => openKnowledgeCreate(row.question_summary)}
                                                sx={{ fontSize: "13.5px", whiteSpace: "nowrap" }}
                                            >
                                                지식 등록
                                            </Button>
                                        ) : null}
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

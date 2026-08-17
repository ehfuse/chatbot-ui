/**
 * UsageTab.tsx
 *
 * 챗봇 관리 > 사용현황 탭.
 * 기간별로 누가 몇 번 질문했고 지식을 몇 건 교육했는지, 토큰을 얼마나 썼고 예상 금액이 얼마인지 보여준다.
 * 101(본사) 로그인 시 가맹점 필터를 추가로 제공한다.
 */
import { useCallback, useState } from "react";
import {
    Box,
    ButtonBase,
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
import type { useChatbotManageController } from "../../../controllers/manageController";
import type { ChatbotUsage, UsageAccountRow } from "../../../types/manage";
import { ManageStatCard, type StatTone } from "../components/ManageStatCard";
import { ManageTabScroll } from "../components/ManageTabScroll";
import {
    MANAGE_COLORS,
    manageBodyCellSx,
    manageBodyRowSx,
    manageFilterRowSx,
    manageHeadCellSx,
    manageRangeButtonSx,
    manageTableSx,
} from "../components/manageTableStyles";

/** 사용현황 탭 props 타입이다. */
interface UsageTabProps {
    controller: ReturnType<typeof useChatbotManageController>; // 챗봇 관리 컨트롤러
    isHeadOffice: boolean; // 본사 로그인 여부 — 가맹점 필터 노출 기준
}

/** 토큰 수를 읽기 쉬운 단위로 줄인다 (1,234,567 → 1.23M). */
function formatTokens(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
}

/** 금액을 원화 표기로 만든다. */
function formatKrw(value: number): string {
    return `${Math.round(value).toLocaleString()}원`;
}

/** 사용현황 응답을 카드 5장으로 변환한다. */
function buildUsageCards(usage: ChatbotUsage | null): Array<{ label: string; value: string; tone: StatTone; hint?: string }> {
    const totals = usage?.totals;
    const questions = Number(totals?.questions) || 0;
    const inputTokens = Number(totals?.input_tokens) || 0;
    const outputTokens = Number(totals?.output_tokens) || 0;
    const cost = Number(totals?.cost) || 0;
    // 질문 1회당 비용은 "앞으로 얼마나 들까"를 가늠하는 값이라 카드로 따로 보여준다.
    const perQuestion = questions > 0 ? cost / questions : 0;
    return [
        {
            label: "질문 수",
            value: questions.toLocaleString(),
            tone: { bg: "#eff6ff", fg: "#1d4ed8" },
            hint: `사용자 ${(Number(totals?.users) || 0).toLocaleString()}명`,
        },
        {
            label: "가르친 지식",
            value: (Number(totals?.taught_count) || 0).toLocaleString(),
            tone: { bg: "#ecfdf5", fg: "#047857" },
        },
        { label: "입력 토큰", value: formatTokens(inputTokens), tone: { bg: "#f5f3ff", fg: "#6d28d9" } },
        { label: "출력 토큰", value: formatTokens(outputTokens), tone: { bg: "#fff7ed", fg: "#c2410c" } },
        {
            label: "예상 금액",
            value: formatKrw(cost),
            tone: { bg: "#fef2f2", fg: "#b91c1c" },
            hint: questions > 0 ? `질문당 ${formatKrw(perQuestion)}` : undefined,
        },
    ];
}

/** 일자별 사용량 막대 그래프 — 별도 차트 라이브러리 없이 비율 막대로 그린다. */
function DailyTrend({ usage }: { usage: ChatbotUsage | null }) {
    const daily = usage?.daily ?? [];
    if (daily.length === 0) return null;
    const max = Math.max(...daily.map((row) => row.questions), 1);
    return (
        <Box sx={{ px: 1.5, pb: 2 }}>
            <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827", pb: 1 }}>일자별 질문 추이</Typography>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height: 120, overflowX: "auto" }}>
                {daily.map((row) => (
                    <Box
                        key={row.date}
                        title={`${row.date} · 질문 ${row.questions}건 · ${formatKrw(row.cost)}`}
                        sx={{
                            flex: "1 0 14px",
                            minWidth: 14,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            height: "100%",
                        }}
                    >
                        <Box
                            sx={{
                                // 질문 0건인 날도 막대가 보이도록 최소 높이를 준다.
                                height: `${Math.max((row.questions / max) * 100, 3)}%`,
                                bgcolor: "#2563eb",
                                borderRadius: "3px 3px 0 0",
                            }}
                        />
                    </Box>
                ))}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", pt: 0.75 }}>
                <Typography sx={{ fontSize: "12.5px", color: "#4b5563" }}>{daily[0]?.date}</Typography>
                <Typography sx={{ fontSize: "12.5px", color: "#4b5563" }}>{daily[daily.length - 1]?.date}</Typography>
            </Box>
        </Box>
    );
}

/** 계정별 사용현황 표의 한 행이다. */
function UsageRow({ row, isHeadOffice }: { row: UsageAccountRow; isHeadOffice: boolean }) {
    return (
        <TableRow sx={manageBodyRowSx}>
            <TableCell sx={manageBodyCellSx}>
                <Box sx={{ fontWeight: 600 }}>{row.account_name}</Box>
                {isHeadOffice && row.license_name ? (
                    <Box sx={{ fontSize: "13px", color: MANAGE_COLORS.textSecondary }}>{row.license_name}</Box>
                ) : null}
            </TableCell>
            <TableCell sx={manageBodyCellSx} align="right">
                {row.questions.toLocaleString()}
            </TableCell>
            <TableCell sx={manageBodyCellSx} align="right">
                {/* 승인 건수를 함께 보여준다 — 등록만 하고 승인 안 된 지식은 아직 챗봇이 쓰지 않는다. */}
                {row.taught_count > 0 ? `${row.taught_count.toLocaleString()} (승인 ${row.verified_count})` : "-"}
            </TableCell>
            <TableCell sx={manageBodyCellSx} align="right">
                {formatTokens(row.input_tokens)}
            </TableCell>
            <TableCell sx={manageBodyCellSx} align="right">
                {formatTokens(row.output_tokens)}
            </TableCell>
            <TableCell sx={{ ...manageBodyCellSx, fontWeight: 600 }} align="right">
                {formatKrw(row.cost)}
            </TableCell>
            <TableCell sx={manageBodyCellSx}>
                {row.last_used_time ? formatDateTime(row.last_used_time) : "-"}
            </TableCell>
        </TableRow>
    );
}

/** 사용현황 탭 컴포넌트다. */
export function UsageTab({ controller, isHeadOffice }: UsageTabProps) {
    const { state } = controller;
    const usageRaw = state.useValue("usage") as ChatbotUsage | null | undefined;
    const usage = usageRaw ?? null;
    const usageFrom = (state.useValue("usageFrom") as string | undefined) ?? "";
    const usageTo = (state.useValue("usageTo") as string | undefined) ?? "";
    const usageLicenseSeq = (state.useValue("usageLicenseSeq") as string | undefined) ?? "";
    const [rangeAnchorEl, setRangeAnchorEl] = useState<HTMLElement | null>(null);

    /** 기간 변경 — 값 반영 후 즉시 재조회한다(조회 버튼 없음). */
    const handleRangeChange = useCallback(
        (from: string, to: string) => {
            state.setValue("usageFrom", from);
            state.setValue("usageTo", to);
            state.actions.loadUsage();
        },
        [state]
    );

    /** 가맹점명 검색 — 서버가 이름 LIKE 로 seq 를 해석한다. */
    const handleLicenseSearch = useCallback(() => state.actions.loadUsage(), [state.actions]);

    const cards = buildUsageCards(usage);
    const accounts = usage?.accounts ?? [];
    const pricing = usage?.pricing;
    const hasRange = Boolean(usageFrom || usageTo);
    const rangeLabel = hasRange ? `${usageFrom || "처음"} ~ ${usageTo || "오늘"}` : "기간 (전체)";

    return (
        <ManageTabScroll
            toolbar={
                <>
                <Box sx={{ ...manageFilterRowSx, gap: 1.5 }}>
                    {isHeadOffice ? (
                        <SearchTextField
                            size="small"
                            placeholder="가맹점명을 입력하세요"
                            value={usageLicenseSeq}
                            onChange={(e) => state.setValue("usageLicenseSeq", e.target.value)}
                            onSearch={handleLicenseSearch}
                            onClear={() => {
                                state.setValue("usageLicenseSeq", "");
                                state.actions.loadUsage();
                            }}
                            sx={{ width: 300 }}
                        />
                    ) : null}
                    <ButtonBase onClick={(event) => setRangeAnchorEl(event.currentTarget)} sx={manageRangeButtonSx(hasRange)}>
                        <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />
                        {rangeLabel}
                    </ButtonBase>
                </Box>

    {/* 기간 선택 팝오버 — 분석 탭과 동일한 버튼+팝오버 패턴 */}
                <Popover
                    transitionDuration={0}
                    anchorEl={rangeAnchorEl}
                    open={Boolean(rangeAnchorEl)}
                    onClose={() => setRangeAnchorEl(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    slotProps={{ paper: { sx: { p: 1.5 } } }}
                >
                    <TaskDateRangeFilter fromDate={usageFrom} toDate={usageTo} onChange={handleRangeChange} />
                </Popover>

                {/* 요약 카드 5장 */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" },
                        gap: 1.5,
                        p: 1.5,
                    }}
                >
                    {cards.map((card) => (
                        <ManageStatCard key={card.label} label={card.label} value={card.value} tone={card.tone} hint={card.hint} />
                    ))}
                </Box>

                <DailyTrend usage={usage} />

                {/* 계정별 상세 */}
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
                    사용자별 상세
                </Typography>
                </>
            }
        >
            {/* 표만 스크롤한다 — 요약 카드는 위 고정 영역, th 는 sticky 로 상단에 붙는다.
                여기에 overflowX 를 걸면 이 Box 가 새 스크롤 기준이 되어 sticky th 가 동작하지 않는다
                (가로 스크롤은 바깥 OverlayScrollbar 가 맡는다). 표 상단선은 위 고정 영역이 그린다. */}
            <Box>
                <Table size="small" sx={{ minWidth: 900, ...manageTableSx }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={manageHeadCellSx}>사용자</TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 90 }} align="right">
                                질문
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 150 }} align="right">
                                가르친 지식
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 110 }} align="right">
                                입력 토큰
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 110 }} align="right">
                                출력 토큰
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 120 }} align="right">
                                예상 금액
                            </TableCell>
                            <TableCell sx={{ ...manageHeadCellSx, width: 160 }}>마지막 사용</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {accounts.length === 0 ? (
                            <TableRow>
                                <TableCell sx={manageBodyCellSx} colSpan={7} align="center">
                                    이 기간에 사용 기록이 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            accounts.map((row) => <UsageRow key={row.account_seq} row={row} isHeadOffice={isHeadOffice} />)
                        )}
                    </TableBody>
                </Table>
            </Box>

            {/* 금액 산정 근거 — 단가가 바뀌면 과거 조회 금액도 함께 바뀌므로 기준을 명시한다. */}
            {pricing ? (
                <Typography sx={{ fontSize: "13px", color: MANAGE_COLORS.textSecondary, p: 1.5 }}>
                    예상 금액은 입력 100만 토큰당 ${pricing.input_usd_per_mtok} · 출력 100만 토큰당 $
                    {pricing.output_usd_per_mtok} · 환율 {pricing.usd_to_krw.toLocaleString()}원 기준으로 계산한 값이며,
                    실제 청구액과 다를 수 있습니다.
                </Typography>
            ) : null}
        </ManageTabScroll>
    );
}

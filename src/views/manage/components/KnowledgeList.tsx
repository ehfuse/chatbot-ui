/**
 * KnowledgeList.tsx
 *
 * 챗봇 관리 지식 목록 — 업무함(@ehfuse/taskbox) 목록 보기와 동일한 구조/스타일이다.
 * MUI Table 대신 CSS grid 행 + Virtuoso 가상화를 쓰고, 스크롤은 OverlayScrollbar 를
 * Virtuoso 의 customScrollParent 로 연결한다(업무함 TaskBoxTable 과 같은 방식).
 * 끝에 닿으면 endReached 로 다음 페이지를 이어 붙인다(무한스크롤).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Fade, Menu, MenuItem, Tooltip } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import OverlayScrollbar, { type OverlayScrollbarRef } from "@ehfuse/overlay-scrollbar";
import { Virtuoso } from "react-virtuoso";
import { HighlightText } from "../../../internal/HighlightText";
import { formatDate, formatDateTimeShort } from "../../../internal/dateUtils";
import type { DuplicateGroup, KnowledgeRow, KnowledgeSort } from "../../../types/manage";
import { SatisfactionRating, ScopeChip, StatusChip } from "./KnowledgeChips";
import { MANAGE_COLORS } from "./manageTableStyles";

/** 목록 컬럼 그리드 템플릿이다. (스코프 · 분류 · 제목 · 상태 · 교육자 · 만족도 · 검증일 · 수정일시) */
const SCOPE_COLUMN_WIDTH = "110px";
const GRID_TEMPLATE_BASE = "120px minmax(0, 1fr) 90px 100px 130px 110px 130px";

/** 일시를 "yy.mm.dd hh:nn" 으로 표시한다. (기존 formatDate 는 시:분이 없고 formatDateTimeShort 는 연도가 없다) */
function formatShortDateTime(value: string | null | undefined): string {
    if (!value) return "-";
    const datePart = formatDate(value, "YY.MM.DD");
    if (!datePart) return "-";
    // 시:분은 formatDateTimeShort("M.D HH:mm") 결과에서 뒤쪽 시각만 떼어 쓴다(시간 계산을 다시 구현하지 않는다).
    const timePart = formatDateTimeShort(value).split(" ")[1] ?? "";
    return timePart ? `${datePart} ${timePart}` : datePart;
}

/** 목록 컬럼 정의다. sort 가 있으면 정렬 가능한 헤더로 그린다. */
interface KnowledgeColumn {
    id: string; // 컬럼 식별자
    label: string; // 헤더 라벨
    align?: "center"; // 가운데 정렬 여부
    sort?: KnowledgeSort; // 정렬 기준(있으면 정렬 가능 헤더)
    filter?: "scope" | "category"; // 필터 종류(있으면 선택 메뉴를 연다)
}

/** 스코프 컬럼을 뺀 기본 컬럼이다. (스코프는 본사에서만 의미가 있어 별도로 앞에 붙인다) */
const BASE_COLUMNS: KnowledgeColumn[] = [
    { id: "category", label: "분류", align: "center", filter: "category" },
    { id: "title", label: "제목", sort: "title" },
    { id: "status", label: "상태", align: "center" },
    { id: "taught_by", label: "교육자", align: "center" },
    { id: "satisfaction", label: "만족도", align: "center", sort: "good_count" },
    { id: "verified", label: "검증일", align: "center", sort: "verified_time" },
    { id: "updated", label: "수정일시", align: "center", sort: "updated_time" },
];

/** 스코프 컬럼 정의다. */
const SCOPE_COLUMN: KnowledgeColumn = { id: "scope", label: "스코프", align: "center", filter: "scope" };

/** 중복의심 모드에서 그리는 행 1개다. (그룹 머리행 + 그 아래 지식 행) */
type DuplicateRow =
    | { kind: "group"; score: number; count: number; key: string }
    | { kind: "item"; row: KnowledgeRow; last: boolean; key: string };

/** 중복 그룹을 화면에 그릴 평탄 행 목록으로 편다. */
function flattenDuplicateGroups(groups: DuplicateGroup[]): DuplicateRow[] {
    const rows: DuplicateRow[] = [];
    groups.forEach((group, groupIndex) => {
        rows.push({ kind: "group", score: group.score, count: group.items.length, key: `g${groupIndex}` });
        group.items.forEach((row, index) => {
            rows.push({ kind: "item", row, last: index === group.items.length - 1, key: `g${groupIndex}-${row.seq}` });
        });
    });
    return rows;
}

/** 지식 목록 props 타입이다. */
interface KnowledgeListProps {
    items: KnowledgeRow[]; // 표시할 지식 목록(무한스크롤 누적본)
    searchText: string; // 검색어(제목 하이라이트)
    duplicateGroups?: DuplicateGroup[]; // 중복의심 모드일 때 표시할 그룹(지정되면 그룹 목록으로 그린다)
    sort: KnowledgeSort; // 현재 정렬 기준
    sortDir: "ASC" | "DESC"; // 현재 정렬 방향
    onSortChange: (sort: KnowledgeSort) => void; // 헤더 클릭(정렬 변경)
    categoryValue: string; // 현재 분류 필터("" = 전체)
    categoryOptions: string[]; // 선택 가능한 분류 목록
    onCategoryChange: (category: string) => void; // 분류 필터 변경
    scopeValue: string; // 현재 스코프 필터("" = 전체, "shared" = 공용, 숫자문자열 = 가맹점)
    scopeOptions: Array<{ value: string; label: string }>; // 선택 가능한 스코프 목록
    onScopeChange: (scope: string) => void; // 스코프 필터 변경
    showScope: boolean; // 스코프 컬럼 표시 여부(본사 101 에서만 의미가 있다)
    onEndReached: () => void; // 목록 끝 도달(다음 페이지 로드)
    onRowClick: (row: KnowledgeRow) => void; // 행 클릭(편집 다이얼로그)
}

/** 챗봇 관리 지식 목록 컴포넌트다. (업무함 목록 보기와 동일 구성) */
export function KnowledgeList({
    items,
    searchText,
    duplicateGroups,
    sort,
    sortDir,
    onSortChange,
    categoryValue,
    categoryOptions,
    onCategoryChange,
    scopeValue,
    scopeOptions,
    onScopeChange,
    showScope,
    onEndReached,
    onRowClick,
}: KnowledgeListProps) {
    // OverlayScrollbar 컨테이너를 Virtuoso 스크롤 부모로 연결한다(업무함과 동일).
    const scrollbarRef = useRef<OverlayScrollbarRef | null>(null);
    const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
    // 세로 스크롤 존재 여부 — 있으면 마지막 행이 표 하단 테두리에 닿으므로 하단선을 생략하고, 없으면 그린다.
    // (업무함 TaskBoxTable 과 동일한 판정 방식)
    const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
    // 목록 건수가 바뀌면 가상화 래퍼 요소가 통째로 갈릴 수 있다. 그때 예전 요소만 지켜보고 있으면
    // 판정이 처음 값(스크롤 있음)에 멈춰, 필터로 몇 건만 남아도 마지막 행 하단선이 계속 빠진다.
    // → 건수를 의존성에 넣어 매번 현재 요소를 다시 잡고 측정한다.
    const rowCount = duplicateGroups ? duplicateGroups.length : items.length;
    useEffect(() => {
        if (!scrollParent) return;
        const measure = () => setHasVerticalScroll(scrollParent.scrollHeight > scrollParent.clientHeight);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(scrollParent);
        // 가상화 콘텐츠 높이 변화(행 증감)도 감지한다.
        if (scrollParent.firstElementChild) observer.observe(scrollParent.firstElementChild);
        return () => observer.disconnect();
    }, [scrollParent, rowCount]);

    // 필터 메뉴를 띄울 기준 요소와 대상 컬럼(스코프/분류).
    const [filterMenu, setFilterMenu] = useState<{ kind: "scope" | "category"; anchor: HTMLElement } | null>(null);

    // 가맹점 계정은 자기 스코프 지식만 보이므로 스코프 컬럼을 아예 그리지 않는다.
    const columns = showScope ? [SCOPE_COLUMN, ...BASE_COLUMNS] : BASE_COLUMNS;
    const gridTemplate = showScope ? `${SCOPE_COLUMN_WIDTH} ${GRID_TEMPLATE_BASE}` : GRID_TEMPLATE_BASE;
    // 중복의심 모드면 그룹을 평탄 행으로 펴서 그린다(일반 목록과 같은 행 컴포넌트를 재사용).
    const duplicateRows = duplicateGroups ? flattenDuplicateGroups(duplicateGroups) : null;

    /** 스크롤 컨테이너가 준비되면 Virtuoso 부모로 등록한다. */
    const handleScrollbarRef = useCallback((instance: OverlayScrollbarRef | null) => {
        scrollbarRef.current = instance;
        setScrollParent(instance?.getScrollContainer() ?? null);
    }, []);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                // 부모가 준 높이를 그대로 채운다(업무함 표와 동일 — 고정 높이를 쓰지 않는다).
                flex: 1,
                minHeight: 0,
                bgcolor: MANAGE_COLORS.surface,
                color: MANAGE_COLORS.textPrimary,
            }}
        >
            {/* 컬럼 헤더 — 업무함과 동일하게 그리드로 그리고 세로 구분선을 잇는다. */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: gridTemplate,
                    borderBottom: `1px solid ${MANAGE_COLORS.borderStrong}`,
                    flexShrink: 0,
                    bgcolor: MANAGE_COLORS.surface,
                    "& > *": { borderRight: `1px solid ${MANAGE_COLORS.border}` },
                    "& > *:last-child": { borderRight: "none", pr: 2 },
                }}
            >
                {columns.map((column) => {
                    const isSorted = Boolean(column.sort) && sort === column.sort;
                    // 스코프·분류 헤더는 정렬 대신 선택 메뉴를 연다(업무함 필터 컬럼과 같은 규칙).
                    const activeFilterValue =
                        column.filter === "category" ? categoryValue : column.filter === "scope" ? scopeValue : "";
                    const isFiltered = Boolean(column.filter) && activeFilterValue !== "";
                    // 필터가 걸리면 헤더에 선택값을 보여준다(스코프는 라벨로 변환).
                    const filteredLabel =
                        column.filter === "scope"
                            ? (scopeOptions.find((option) => option.value === scopeValue)?.label ?? scopeValue)
                            : activeFilterValue;
                    const clickable = Boolean(column.sort) || Boolean(column.filter);
                    return (
                        <Box
                            key={column.id}
                            onClick={(event) => {
                                if (column.filter) setFilterMenu({ kind: column.filter, anchor: event.currentTarget });
                                else if (column.sort) onSortChange(column.sort);
                            }}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: column.align === "center" ? "center" : "flex-start",
                                gap: 0.5,
                                px: 1,
                                py: 1,
                                minWidth: 0,
                                fontSize: 13,
                                // 클릭되는 헤더는 진하게, 기능 없는 헤더는 흐리게(업무함 규칙).
                                color: clickable ? MANAGE_COLORS.textStrong : MANAGE_COLORS.textSecondary,
                                whiteSpace: "nowrap",
                                cursor: clickable ? "pointer" : "default",
                                userSelect: "none",
                                // 정렬 중이거나 필터가 걸린 헤더는 파란 글자로만 강조한다(굵기는 올리지 않는다).
                                ...(isSorted ? { color: "#2f80ed" } : {}),
                                ...(isFiltered ? { color: "#2f80ed" } : {}),
                            }}
                        >
                            {/* 필터가 걸리면 헤더 라벨을 선택값으로 바꿔 무엇으로 걸렀는지 바로 보이게 한다. */}
                            {isFiltered ? filteredLabel : column.label}
                            {column.filter ? <FilterListIcon sx={{ fontSize: 14 }} /> : null}
                            {isSorted ? (
                                sortDir === "ASC" ? (
                                    <ArrowUpwardIcon sx={{ fontSize: 13 }} />
                                ) : (
                                    <ArrowDownwardIcon sx={{ fontSize: 13 }} />
                                )
                            ) : null}
                        </Box>
                    );
                })}
            </Box>

            {/* 본문 — 중복의심 모드면 그룹 목록, 아니면 일반 목록을 그린다. */}
            {duplicateRows ? (
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    <OverlayScrollbar ref={handleScrollbarRef} style={{ height: "100%" }} thumb={{ width: 8 }}>
                        {scrollParent ? (
                            <Virtuoso
                                customScrollParent={scrollParent}
                                data={duplicateRows}
                                computeItemKey={(_index, row) => row.key}
                                itemContent={(_index, row) =>
                                    row.kind === "group" ? (
                                        // 그룹 머리행 — 이 아래 행들이 서로 중복 의심인 묶음이다.
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                px: 1.5,
                                                py: 1,
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: MANAGE_COLORS.textStrong,
                                                bgcolor: MANAGE_COLORS.surfaceSubtle,
                                                borderTop: `1px solid ${MANAGE_COLORS.borderStrong}`,
                                                borderBottom: `1px solid ${MANAGE_COLORS.border}`,
                                            }}
                                        >
                                            <ContentCopyOutlinedIcon sx={{ fontSize: 15, color: "#854d0e" }} />
                                            유사도 {Math.round(row.score * 100)}%
                                            <Box component="span" sx={{ fontWeight: 400, color: MANAGE_COLORS.textSecondary }}>
                                                · {row.count}건이 서로 비슷합니다
                                            </Box>
                                        </Box>
                                    ) : (
                                        <KnowledgeListRow
                                            row={row.row}
                                            searchText={searchText}
                                            hideBottomBorder={row.last && hasVerticalScroll}
                                            showScope={showScope}
                                            gridTemplate={gridTemplate}
                                            onClick={onRowClick}
                                        />
                                    )
                                }
                            />
                        ) : null}
                    </OverlayScrollbar>
                </Box>
            ) : items.length === 0 ? (
                <Box sx={{ flex: 1, py: 4, textAlign: "center", fontSize: 14, color: MANAGE_COLORS.textMuted }}>
                    등록된 지식이 없습니다.
                </Box>
            ) : (
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    <OverlayScrollbar ref={handleScrollbarRef} style={{ height: "100%" }} thumb={{ width: 8 }}>
                        {scrollParent ? (
                            <Virtuoso
                                customScrollParent={scrollParent}
                                data={items}
                                computeItemKey={(_index, row) => row.seq}
                                // 끝에 닿으면 다음 50건을 이어 붙인다(업무함 무한스크롤과 동일).
                                endReached={onEndReached}
                                itemContent={(index, row) => (
                                    <KnowledgeListRow
                                        row={row}
                                        searchText={searchText}
                                        hideBottomBorder={index === items.length - 1 && hasVerticalScroll}
                                        showScope={showScope}
                                        gridTemplate={gridTemplate}
                                        onClick={onRowClick}
                                    />
                                )}
                            />
                        ) : null}
                    </OverlayScrollbar>
                </Box>
            )}

            {/* 필터 선택 메뉴 — 헤더의 "스코프"/"분류"를 누르면 열린다. */}
            <Menu
                anchorEl={filterMenu?.anchor ?? null}
                open={Boolean(filterMenu)}
                onClose={() => setFilterMenu(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
                {(filterMenu?.kind === "scope"
                    ? [{ value: "", label: "전체" }, ...scopeOptions]
                    : [{ value: "", label: "전체" }, ...categoryOptions.map((c) => ({ value: c, label: c }))]
                ).map((option) => {
                    const current = filterMenu?.kind === "scope" ? scopeValue : categoryValue;
                    return (
                        <MenuItem
                            key={option.value || "all"}
                            selected={current === option.value}
                            onClick={() => {
                                if (filterMenu?.kind === "scope") onScopeChange(option.value);
                                else onCategoryChange(option.value);
                                setFilterMenu(null);
                            }}
                            sx={{ fontSize: 14 }}
                        >
                            {option.label}
                        </MenuItem>
                    );
                })}
            </Menu>
        </Box>
    );
}

/** 지식 목록 행 1개다. (업무함 TaskBoxRow 와 동일한 그리드/셀 규칙) */
function KnowledgeListRow({
    row,
    searchText,
    hideBottomBorder,
    showScope,
    gridTemplate,
    onClick,
}: {
    row: KnowledgeRow; // 지식 행
    searchText: string; // 검색어(제목 하이라이트)
    hideBottomBorder: boolean; // 마지막 행 하단선 생략
    showScope: boolean; // 스코프 칸 표시 여부(헤더와 동일해야 컬럼이 어긋나지 않는다)
    gridTemplate: string; // 헤더와 공유하는 그리드 템플릿
    onClick: (row: KnowledgeRow) => void; // 행 클릭
}) {
    return (
        <Box
            onClick={() => onClick(row)}
            sx={{
                display: "grid",
                gridTemplateColumns: gridTemplate,
                minHeight: 48,
                // 셀 텍스트 공통 폰트 — 업무함 행과 동일(기본보다 1px 작게).
                fontSize: 15,
                cursor: "pointer",
                bgcolor: MANAGE_COLORS.surface,
                borderBottom: hideBottomBorder ? "none" : `1px solid ${MANAGE_COLORS.border}`,
                "&:hover": { bgcolor: MANAGE_COLORS.surfaceHover },
                // 셀을 세로로 꽉 채워 컬럼 세로 구분선이 행 전체 높이로 그려지게 한다.
                "& > .cell": {
                    px: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    borderRight: `1px solid ${MANAGE_COLORS.border}`,
                },
                "& > .cell:last-child": { borderRight: "none", pr: 2 },
            }}
        >
            {showScope ? (
                <Box className="cell" sx={{ justifyContent: "center" }}>
                    <ScopeChip targetLicenseSeq={row.target_license_seq} targetLicenseName={row.target_license_name} />
                </Box>
            ) : null}
            <Box className="cell" sx={{ justifyContent: "center", fontSize: 14 }}>
                {row.category || "-"}
            </Box>
            <Box className="cell" sx={{ gap: 1 }}>
                <Box
                    sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        // 제목은 업무함 업무 제목과 같은 굵기/색이다.
                        fontWeight: 500,
                        color: MANAGE_COLORS.textStrong,
                    }}
                >
                    <HighlightText text={row.title} keyword={searchText} />
                </Box>
                {/* 첨부 이미지가 있는 지식은 제목 오른쪽에 이미지 아이콘으로 알린다.
                    브라우저 기본 툴팁(titleAccess) 대신 MUI Tooltip 을 쓴다 — 화살표 표시, 전환 애니메이션 없음. */}
                {(row.media_uuids?.length ?? 0) > 0 ? (
                    <Tooltip
                        title={`첨부 이미지 ${row.media_uuids.length}장`}
                        arrow
                        placement="top"
                        slots={{ transition: Fade }}
                        slotProps={{ transition: { timeout: 0 } }}
                    >
                        <ImageOutlinedIcon sx={{ fontSize: 17, color: MANAGE_COLORS.textMuted, flexShrink: 0 }} />
                    </Tooltip>
                ) : null}
            </Box>
            <Box className="cell" sx={{ justifyContent: "center" }}>
                <StatusChip status={row.status} />
            </Box>
            <Box className="cell" sx={{ justifyContent: "center", fontSize: 14 }}>
                {row.taught_by_name || "-"}
            </Box>
            <Box className="cell" sx={{ justifyContent: "center" }}>
                <SatisfactionRating goodCount={Number(row.good_count) || 0} badCount={Number(row.bad_count) || 0} />
            </Box>
            <Box className="cell" sx={{ justifyContent: "center", fontSize: 14 }}>
                {row.verified_time ? formatDate(row.verified_time) : "-"}
            </Box>
            <Box className="cell" sx={{ justifyContent: "center", fontSize: 14 }}>
                {formatShortDateTime(row.updated_time)}
            </Box>
        </Box>
    );
}

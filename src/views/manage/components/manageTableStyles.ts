/**
 * manageTableStyles.ts
 *
 * 챗봇 관리 페이지 공통 스타일 상수.
 * 업무함(@ehfuse/taskbox) 라이트 테마(useTaskboxTheme 라이트모드 colors)와 동일한 값을 사용해
 * 탭/표 모양을 업무함과 통일한다. (테마 훅 의존 없이 값만 복사)
 */

/** 업무함 라이트 테마 색상값이다. (taskbox useTaskboxTheme 라이트모드 colors 동일값) */
export const MANAGE_COLORS = {
    surface: "#ffffff", // 표/헤더/탭 배경 (colors.surface)
    surfaceHover: "#f8f8f7", // 행 hover 배경 (colors.surfaceHover)
    surfaceSubtle: "#f7f7f5", // 그룹 머리행 배경 (colors.surfaceSubtle — 업무함 그룹 헤더와 동일)
    border: "#e6e6e3", // 행 구분선 (colors.border)
    textSecondary: "#787774", // 표 헤더 글자 (colors.textSecondary — 업무함 th 와 동일)
    borderStrong: "#dedddb", // 표 테두리/헤더 하단선/탭 테두리 (colors.borderStrong)
    textStrong: "#000000", // 선택 탭 배경·강조 글자 (colors.textStrong)
    textPrimary: "#37352f", // 본문/헤더 글자 (colors.textPrimary)
    textMuted: "#9a9a97", // 빈 목록 안내 글자 (colors.textMuted)
} as const;

/** 표 헤더 셀 공통 sx 다. (업무함 표 헤더와 동일 — 13px / 굵기 기본 / 흐린 글자 textSecondary)
 *  업무함은 기능 없는 th 를 흐리게 두고 굵게 하지 않는다(정렬·필터가 걸린 th 만 강조된다). */
export const manageHeadCellSx = {
    fontSize: 13,
    fontWeight: 400,
    color: MANAGE_COLORS.textSecondary,
    // 스크롤 컨테이너(ManageTabScroll) 안에서 헤더가 상단에 붙게 한다 — 표가 길어도 컬럼명을 계속 볼 수 있다.
    // 배경이 불투명해야(surface) 스크롤되는 행이 헤더 밑으로 비치지 않는다.
    position: "sticky",
    top: 0,
    zIndex: 2,
    bgcolor: MANAGE_COLORS.surface,
    borderBottom: `1px solid ${MANAGE_COLORS.borderStrong}`,
    whiteSpace: "nowrap",
    userSelect: "none",
    py: 1,
} as const;

/** 정렬 가능한 헤더 셀 sx 다. (업무함은 클릭되는 th 를 진한 글자로 둬서 상호작용 여부를 색으로 알린다) */
export const manageSortableHeadCellSx = {
    ...manageHeadCellSx,
    color: MANAGE_COLORS.textStrong,
} as const;

/** 표 데이터 셀 공통 sx 다. (14px 본문 글자 + 하단 1px 행 구분선) */
export const manageBodyCellSx = {
    fontSize: 14,
    color: MANAGE_COLORS.textPrimary,
    borderBottom: `1px solid ${MANAGE_COLORS.border}`,
    py: 1,
} as const;

/** 제목 셀 sx 다. (업무함 표의 업무 제목과 동일 — 15px / 굵기 500 / 진한 검정 textStrong)
 *  일반 본문 셀(14px, textPrimary)보다 한 단계 크고 진해 목록에서 제목이 먼저 읽힌다. */
export const manageTitleCellSx = {
    ...manageBodyCellSx,
    fontSize: 15,
    fontWeight: 500,
    color: MANAGE_COLORS.textStrong,
} as const;

/** 표 데이터 행 공통 sx 다. (hover 시 업무함 surfaceHover 배경) */
export const manageBodyRowSx = {
    "&:hover": { bgcolor: MANAGE_COLORS.surfaceHover },
} as const;

/** 표 공통 sx 다. (컬럼 사이 세로 구분선 — 업무함 표 규칙)
 *  마지막 행 하단선은 여기서 지우지 않는다 — 세로 스크롤이 있을 때만 생략해야 하므로
 *  스크롤 컨테이너(ManageTabScroll)가 판정해서 끈다. */
export const manageTableSx = {
    // 기본 border-collapse 는 셀 테두리를 표가 대신 그려 sticky 헤더를 따라가지 않는다(스크롤하면 선이 사라진다).
    // separate + spacing 0 이면 셀이 자기 테두리를 직접 그려 헤더 하단선이 고정된 채 유지된다.
    borderCollapse: "separate",
    borderSpacing: 0,
    // 컬럼 사이 세로 구분선 — 마지막 컬럼은 표 테두리와 겹치므로 제외한다.
    "& th:not(:last-child), & td:not(:last-child)": {
        borderRight: `1px solid ${MANAGE_COLORS.border}`,
    },
} as const;

/** 탭 아래 콘텐츠(필터+표)를 감싸는 테두리 박스 sx 다. (상단 보더 라인 위에 탭이 얹힌다) */
export const manageTabPanelSx = {
    border: `1px solid ${MANAGE_COLORS.borderStrong}`,
    borderRadius: "0 0 4px 4px",
    overflow: "hidden",
    bgcolor: MANAGE_COLORS.surface,
} as const;

/** 탭 콘텐츠 상단 필터 행 공통 sx 다. (업무함 툴바 행처럼 하단 1px 선으로 표와 구분) */
export const manageFilterRowSx = {
    display: "flex",
    alignItems: "center",
    gap: 2,
    flexWrap: "wrap",
    px: 1.5,
    py: 1.25,
    borderBottom: `1px solid ${MANAGE_COLORS.borderStrong}`,
} as const;

/** 기간 필터 버튼 sx 다. (관리 탭 공용 — 분석/사용현황이 같은 모양을 쓰도록 한 곳에 둔다) */
export function manageRangeButtonSx(active: boolean) {
    return {
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        fontSize: 13.5,
        fontWeight: active ? 600 : 400,
        whiteSpace: "nowrap",
        flexShrink: 0,
        color: active ? "#2563eb" : "#37352f",
        bgcolor: active ? "#eef4ff" : "transparent",
        "&:hover": { bgcolor: active ? "#eef4ff" : "#f2f2f0" },
    } as const;
}

/**
 * ManageTabs.tsx
 *
 * 챗봇 관리 상단 탭. 업무함(@ehfuse/taskbox) TaskBoxTabs 의 mfd 상단탭 스타일을
 * MUI Tabs/Tab 으로 동일 구현한다. (테마 훅 의존 제거 — 라이트모드 값 고정)
 * 흰 배경 탭이 표 테두리 박스 위에 얹히고, 선택 시 검정 배경 + 흰 글씨로 표시한다(인디케이터 없음).
 */
import { Tab, Tabs } from "@mui/material";
import { MANAGE_COLORS } from "./manageTableStyles";

/** 탭 1개 공통 sx 다. (TaskBoxTabs buildTabSx 라이트모드 동일값) */
const tabSx = {
    minHeight: 46,
    minWidth: 75,
    bgcolor: MANAGE_COLORS.surface,
    color: MANAGE_COLORS.textStrong,
    // 탭 모양 — 위쪽 두 모서리만 둥글게.
    borderRadius: "8px 8px 0 0",
    padding: "10px 18px",
    textTransform: "none",
    fontSize: 14,
    fontWeight: 500,
    border: `1px solid ${MANAGE_COLORS.borderStrong}`,
    borderBottom: "none",
    "&:hover": { bgcolor: MANAGE_COLORS.surfaceHover },
    "&.Mui-selected": {
        bgcolor: MANAGE_COLORS.textStrong,
        color: MANAGE_COLORS.surface,
        border: `1px solid ${MANAGE_COLORS.textStrong}`,
        borderBottom: "none",
        "&:hover": { bgcolor: MANAGE_COLORS.textStrong },
    },
} as const;

/** 챗봇 관리 상단 탭 props 타입이다. */
interface ManageTabsProps {
    labels: string[]; // 탭 라벨 목록(배열 index 가 탭 값)
    counts?: Array<number | null>; // 탭별 건수(null/미지정이면 숫자를 붙이지 않는다)
    value: number; // 현재 선택된 탭 index
    onChange: (next: number) => void; // 탭 변경 콜백
}

/** 챗봇 관리 상단 탭 컴포넌트다. (선택 시 검정 배경 + 흰 글씨) */
export function ManageTabs({ labels, counts, value, onChange }: ManageTabsProps) {
    return (
        <Tabs
            value={value}
            onChange={(_event, next) => onChange(next as number)}
            sx={{
                minHeight: 46,
                "& .MuiTabs-indicator": { display: "none" },
                // 탭 사이를 살짝 띄워 각 탭이 자기 테두리를 온전히 가진다.
                "& .MuiTabs-flexContainer": { gap: "12px", minHeight: 46 },
            }}
        >
            {labels.map((label, index) => {
                // 건수를 아는 탭만 "지식 (161)" 처럼 뒤에 붙인다.
                const count = counts?.[index];
                return (
                    <Tab
                        key={label}
                        value={index}
                        label={typeof count === "number" ? `${label} (${count.toLocaleString()})` : label}
                        sx={tabSx}
                    />
                );
            })}
        </Tabs>
    );
}

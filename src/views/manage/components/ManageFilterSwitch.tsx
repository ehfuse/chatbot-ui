/**
 * ManageFilterSwitch.tsx
 *
 * 챗봇 관리 필터 스위처. 업무함(taskbox) Layout 의 보기 방식 토글(텍스트 버튼 나열)을 모사한다.
 * 드롭다운 대신 텍스트 버튼을 나열하고, 선택된 항목만 파란색으로 강조한다.
 */
import { Box, ButtonBase } from "@mui/material";

/** 스위처 옵션 1개 타입이다. */
export interface ManageFilterSwitchOption {
    value: string; // 옵션 값
    label: string; // 표시 라벨
}

/** 챗봇 관리 필터 스위처 props 타입이다. */
interface ManageFilterSwitchProps {
    options: ManageFilterSwitchOption[]; // 옵션 목록(나열 순서대로 그린다)
    value: string; // 현재 선택된 값
    onChange: (value: string) => void; // 선택 변경 콜백
}

/** 텍스트 버튼 나열형 필터 스위처 컴포넌트다. (업무함 보기 스위처 동일 모양/간격/폰트) */
export function ManageFilterSwitch({ options, value, onChange }: ManageFilterSwitchProps) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <ButtonBase
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1,
                            py: 0.6,
                            borderRadius: 1,
                            fontSize: 13,
                            fontWeight: isSelected ? 500 : 400,
                            color: isSelected ? "#2563eb" : "#787774",
                            bgcolor: isSelected ? "#eef4ff" : "transparent",
                            "&:hover": { bgcolor: isSelected ? "#eef4ff" : "#f2f2f0" },
                        }}
                    >
                        {option.label}
                    </ButtonBase>
                );
            })}
        </Box>
    );
}

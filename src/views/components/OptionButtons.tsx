import { Box, Button } from "@mui/material";
import type { ChatOption } from "../../types";

/** 선택지 버튼 목록 props */
interface OptionButtonsProps {
    options: ChatOption[]; // 선택지 목록
    selectedValue?: string; // 이미 고른 값 (있으면 전체 비활성)
    disabled?: boolean; // 전송 중 등 비활성
    onSelect: (option: ChatOption) => void; // 선택 콜백
}

/** 답변 말풍선 아래 선택지 버튼 목록 — 선택 후에는 비활성화하고 고른 것을 표시한다(5.9). */
export function OptionButtons({ options, selectedValue, disabled, onSelect }: OptionButtonsProps) {
    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mt: 1.25 }}>
            {options.map((option) => {
                const isSelected = selectedValue === option.value;
                return (
                    <Button
                        key={option.value}
                        size="small"
                        variant="contained"
                        disableElevation
                        disabled={Boolean(disabled) || Boolean(selectedValue)}
                        onClick={() => onSelect(option)}
                        sx={{
                            // 테두리 없이 배경색으로 채운 사각 버튼 — 흰 글자.
                            border: "none",
                            borderRadius: "6px",
                            textTransform: "none",
                            fontSize: "13.5px",
                            fontWeight: 400,
                            color: "#ffffff",
                            backgroundColor: "var(--primary)",
                            px: 1.75,
                            "&:hover": { backgroundColor: "var(--primary)", filter: "brightness(0.92)" },
                            "&:active": { filter: "brightness(0.85)" },
                            // 이미 고른 선택지는 진하게, 못 고르게 잠긴 나머지는 흐리게 남긴다.
                            "&.Mui-disabled": {
                                color: "#ffffff",
                                backgroundColor: "var(--primary)",
                                opacity: isSelected ? 1 : 0.45,
                            },
                        }}
                    >
                        {option.label}
                    </Button>
                );
            })}
        </Box>
    );
}

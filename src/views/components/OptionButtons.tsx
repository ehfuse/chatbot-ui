import { useState } from "react";
import { Box, Button, Snackbar } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import type { ChatOption } from "../../types";

/** 선택지 버튼 목록 props */
interface OptionButtonsProps {
    options: ChatOption[]; // 선택지 목록
    selectedValue?: string; // 이미 고른 값 (있으면 전체 비활성)
    disabled?: boolean; // 전송 중 등 비활성
    onSelect: (option: ChatOption) => void; // 선택 콜백
}

/**
 * 답변 말풍선 아래 선택지 버튼 목록 — 선택 후에는 비활성화하고 고른 것을 표시한다(5.9).
 *
 * 링크 선택지(`kind="link"`, 외부 AI 바로가기)는 전송 버튼과 구분되는 테두리 버튼으로 따로 한 줄에 두고,
 * 대화가 이어져도 계속 누를 수 있게 잠그지 않는다(메시지를 보내지 않으므로 대화 흐름에 영향이 없다).
 */
export function OptionButtons({ options, selectedValue, disabled, onSelect }: OptionButtonsProps) {
    const sendOptions = options.filter((option) => option.kind !== "link");
    const linkOptions = options.filter((option) => option.kind === "link");
    const [copiedOpen, setCopiedOpen] = useState(false);

    const handleLink = (option: ChatOption) => {
        onSelect(option);
        if (option.copy_text) setCopiedOpen(true);
    };

    return (
        <>
            {sendOptions.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mt: 1.25 }}>
                    {sendOptions.map((option) => {
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
            )}
            {linkOptions.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {linkOptions.map((option) => (
                        <Button
                            key={option.value}
                            size="small"
                            variant="outlined"
                            endIcon={<OpenInNewIcon sx={{ fontSize: "15px !important" }} />}
                            onClick={() => handleLink(option)}
                            sx={{
                                borderRadius: "6px",
                                textTransform: "none",
                                fontSize: "13.5px",
                                fontWeight: 400,
                                color: "#1f2933",
                                borderColor: "#c9d1d9",
                                backgroundColor: "#ffffff",
                                px: 1.5,
                                "&:hover": { borderColor: "var(--primary)", backgroundColor: "#f5f7fa" },
                            }}
                        >
                            {option.label}
                        </Button>
                    ))}
                </Box>
            )}
            <Snackbar
                open={copiedOpen}
                autoHideDuration={2500}
                onClose={() => setCopiedOpen(false)}
                message="질문을 복사했어요. 열린 창에 붙여넣기 하세요."
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </>
    );
}

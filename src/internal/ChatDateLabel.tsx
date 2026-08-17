/** 대화 목록 날짜 구분선이다 (패키지 내부 전용) — 양쪽 선 + 캘린더 아이콘 + 날짜 pill. */

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { Box, Typography } from "@mui/material";

/** 날짜 구분선 props 다. */
interface ChatDateLabelProps {
    label: string; // 표시할 날짜 라벨
}

/** 대화 목록의 날짜 구분선을 렌더링한다. */
export function ChatDateLabel({ label }: ChatDateLabelProps) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
            }}
        >
            <Typography
                sx={{
                    flex: 1,
                    height: 1,
                    backgroundColor: "#dbe3ee",
                }}
            />
            <Typography
                component="span"
                sx={{
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.55,
                    fontSize: 15,
                    fontWeight: 400,
                    color: "#ffffff",
                    letterSpacing: -0.1,
                    px: 1.5,
                    py: 0.45,
                    borderRadius: 999,
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                }}
            >
                <CalendarMonthOutlinedIcon sx={{ fontSize: 15, color: "rgba(255, 255, 255, 0.88)" }} />
                {label}
            </Typography>
            <Typography
                sx={{
                    flex: 1,
                    height: 1,
                    backgroundColor: "#dbe3ee",
                }}
            />
        </Box>
    );
}

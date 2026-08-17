import { Box } from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

/**
 * 챗봇 답변 말풍선 위에 붙는 "상담봇" 라벨이다.
 *
 * 생성 중 말풍선(MessageList)과 완성된 말풍선(MessageBubble) 두 곳이 같은 라벨을 써야 한다 —
 * 각자 그리면 한쪽만 고쳐져 답변이 끝나는 순간 라벨이 생겼다 사라진 것처럼 보인다.
 */
export function BotLabel() {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mb: 0.25,
                color: "#111",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "var(--font-roboto)",
            }}
        >
            <SmartToyOutlinedIcon sx={{ fontSize: 17 }} />
            상담봇
        </Box>
    );
}

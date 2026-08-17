/** 상담 대화창 예제다 — 드로어를 열고 목업 답변을 받아 본다. */

import { Button, Paper, Stack, Typography } from "@mui/material";
import { useChatbotController } from "@ehfuse/chatbot-ui";

/** 상담 대화창 예제 페이지다. */
export function ChatPage() {
    const { state } = useChatbotController();

    return (
        <Stack gap={2} sx={{ maxWidth: 760 }}>
            <Paper sx={{ p: 3 }}>
                <Typography sx={{ fontSize: "18px", fontWeight: 700, mb: 1 }}>상담 대화창</Typography>
                <Typography sx={{ fontSize: "14.5px", color: "#111827", lineHeight: 1.7, mb: 2 }}>
                    드로어는 레이아웃에 상주하는 <code>ChatbotHostView</code> 가 띄웁니다. 여는 것은 상담 상태
                    (<code>chatbotState.isDrawerOpen</code>)를 켜기만 하면 됩니다.
                </Typography>
                <Button variant="contained" onClick={() => state.setValue("isDrawerOpen", true)}>
                    상담하기 열기
                </Button>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography sx={{ fontSize: "15px", fontWeight: 700, mb: 1.5 }}>목업이 답하는 질문</Typography>
                <Typography sx={{ fontSize: "14.5px", color: "#111827", lineHeight: 1.8 }}>
                    · "빈소 재고를 옮기고 싶어요" → 번호 목록 + 표가 들어간 답변
                    <br />· "발주 알림톡이 두 번 왔어요" → 선택지 버튼이 붙은 답변
                    <br />· 그 밖의 말 → 선택지 안내 답변
                </Typography>
                <Typography sx={{ fontSize: "13.5px", color: "#4b5765", mt: 1.5 }}>
                    답변은 실제 서버처럼 realtime 이벤트로 한 글자씩 흘러 들어옵니다.
                </Typography>
            </Paper>
        </Stack>
    );
}

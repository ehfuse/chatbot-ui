/** 지식 편집 창만 따로 띄워 보는 예제다. */

import { Button, Paper, Stack, Typography } from "@mui/material";
import { openKnowledgeDialogBySeq, useChatbotManageController } from "@ehfuse/chatbot-ui";
import { MOCK_KNOWLEDGE } from "../mocks/data";

/** 지식 편집 창 예제 페이지다. */
export function KnowledgeDialogPage() {
    const { openKnowledgeCreate } = useChatbotManageController();

    return (
        <Stack gap={2} sx={{ maxWidth: 760 }}>
            <Paper sx={{ p: 3 }}>
                <Typography sx={{ fontSize: "18px", fontWeight: 700, mb: 1 }}>지식 편집 창</Typography>
                <Typography sx={{ fontSize: "14.5px", color: "#111827", lineHeight: 1.7, mb: 2 }}>
                    창 자체는 레이아웃의 <code>ChatbotHostView</code> 안에 하나만 떠 있고, 어디서든{" "}
                    <code>openKnowledgeDialogBySeq(seq)</code> 로 엽니다. 상담 말풍선의 "사용된 지식" 링크가 쓰는 방식과
                    같습니다.
                </Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                    {MOCK_KNOWLEDGE.map((row) => (
                        <Button
                            key={row.seq}
                            size="small"
                            variant="outlined"
                            onClick={() => openKnowledgeDialogBySeq(row.seq)}
                        >
                            #{row.seq} {row.title.slice(0, 14)}
                        </Button>
                    ))}
                    <Button size="small" variant="contained" onClick={() => openKnowledgeCreate("새 지식 제목 예시")}>
                        새로 등록
                    </Button>
                </Stack>
            </Paper>
        </Stack>
    );
}

/** 예제 소개 페이지다 — 무엇을 목업으로 흉내 내는지 적어 둔다. */

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

/** 소개 페이지다. */
export function HomePage() {
    return (
        <Stack gap={2} sx={{ maxWidth: 760 }}>
            <Paper sx={{ p: 3 }}>
                <Typography sx={{ fontSize: "18px", fontWeight: 700, mb: 1 }}>@ehfuse/chatbot-ui 예제</Typography>
                <Typography sx={{ fontSize: "14.5px", color: "#111827", lineHeight: 1.7 }}>
                    앱 서버 없이 화면 모양을 보기 위한 예제입니다. <code>entity-client</code> 자리를 메모리 목업으로
                    갈아끼워, 대화 전송·스트리밍 답변·지식 저장/삭제까지 브라우저 안에서만 돌아갑니다.
                    새로고침하면 처음 상태로 돌아갑니다.
                </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography sx={{ fontSize: "15px", fontWeight: 700, mb: 1.5 }}>예제 화면</Typography>
                <Stack gap={1.5}>
                    <Box>
                        <Button component={Link} to="/chat" variant="outlined" size="small">
                            상담 대화창
                        </Button>
                        <Typography sx={{ fontSize: "13.5px", color: "#4b5765", mt: 0.5 }}>
                            드로어 열기 · 스트리밍 답변 · 선택지 버튼 · 평가 · 이전 대화 · 새 창으로 열기
                        </Typography>
                    </Box>
                    <Box>
                        <Button component={Link} to="/manage" variant="outlined" size="small">
                            챗봇 관리 (5탭)
                        </Button>
                        <Typography sx={{ fontSize: "13.5px", color: "#4b5765", mt: 0.5 }}>
                            지식 · 지식 후보 · 답변 피드백 · 분석 · 사용현황
                        </Typography>
                    </Box>
                    <Box>
                        <Button component={Link} to="/knowledge-dialog" variant="outlined" size="small">
                            지식 편집 창
                        </Button>
                        <Typography sx={{ fontSize: "13.5px", color: "#4b5765", mt: 0.5 }}>
                            목록을 거치지 않고 편집 창만 바로 띄워 봅니다.
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography sx={{ fontSize: "15px", fontWeight: 700, mb: 1.5 }}>권한 스위치</Typography>
                <Typography sx={{ fontSize: "14.5px", color: "#111827", lineHeight: 1.7 }}>
                    위쪽 <b>교육자</b> 스위치를 끄면 관리 화면이 안내문으로 바뀌고, 답변 아래 "사용된 지식" 링크도
                    사라집니다. <b>본사</b> 스위치를 끄면 스코프 열과 가맹점 필터가 사라집니다.
                </Typography>
            </Paper>
        </Stack>
    );
}

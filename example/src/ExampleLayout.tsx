/**
 * ExampleLayout.tsx
 *
 * 예제 공통 껍데기다 — 왼쪽 예제 목록 + 위쪽 권한 스위치 + 본문.
 *
 * 상담 드로어와 지식 편집 창은 여기 상주시킨다(`ChatbotHostView`). 실제 앱에서도 레이아웃 헤더에
 * 하나만 두는 자리라, 예제도 같은 모양으로 보여 준다.
 */

import { Box, Divider, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { NavLink, Outlet } from "react-router-dom";
import { ChatbotHostView } from "@ehfuse/chatbot-ui";
import { ExampleChatbotProvider } from "./ExampleChatbotProvider";
import { setExampleRole, useExampleRole } from "./roleStore";

/** 예제 목록이다. */
const EXAMPLES = [
    { to: "/", label: "소개", end: true },
    { to: "/chat", label: "상담 대화창", end: false },
    { to: "/manage", label: "챗봇 관리 (5탭)", end: false },
    { to: "/knowledge-dialog", label: "지식 편집 창", end: false },
];

/** 예제 공통 레이아웃이다. */
export function ExampleLayout() {
    const { isTrainer, isHeadOffice } = useExampleRole();

    return (
        <ExampleChatbotProvider>
            <Box sx={{ display: "flex", height: "100dvh", bgcolor: "#f4f6f8" }}>
                {/* 왼쪽 예제 목록 */}
                <Box
                    sx={{
                        width: 240,
                        flexShrink: 0,
                        bgcolor: "#ffffff",
                        borderRight: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Stack direction="row" alignItems="center" gap={1} sx={{ px: 2, py: 2 }}>
                        <SmartToyOutlinedIcon color="primary" />
                        <Typography sx={{ fontWeight: 700, fontSize: "15px" }}>chatbot-ui 예제</Typography>
                    </Stack>
                    <Divider />
                    <Stack sx={{ p: 1, gap: 0.5 }}>
                        {EXAMPLES.map((example) => (
                            <NavLink
                                key={example.to}
                                to={example.to}
                                end={example.end}
                                style={({ isActive }) => ({
                                    display: "block",
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    fontSize: "14px",
                                    textDecoration: "none",
                                    color: isActive ? "#ffffff" : "#111827",
                                    background: isActive ? "#111827" : "transparent",
                                })}
                            >
                                {example.label}
                            </NavLink>
                        ))}
                    </Stack>
                </Box>

                {/* 본문 */}
                <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    {/* 권한 스위치 — 껐다 켜며 권한별 화면 차이를 바로 볼 수 있다. */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        gap={2}
                        sx={{ px: 2, py: 1, bgcolor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}
                    >
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={isTrainer}
                                    onChange={(event) => setExampleRole({ isTrainer: event.target.checked })}
                                />
                            }
                            label={<Typography sx={{ fontSize: "13.5px" }}>교육자</Typography>}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={isHeadOffice}
                                    onChange={(event) => setExampleRole({ isHeadOffice: event.target.checked })}
                                />
                            }
                            label={<Typography sx={{ fontSize: "13.5px" }}>본사</Typography>}
                        />
                        <Typography sx={{ fontSize: "13px", color: "#4b5765" }}>
                            서버 없이 메모리 목업으로 동작합니다.
                        </Typography>
                    </Stack>

                    <Box sx={{ flex: 1, minHeight: 0, p: 2, overflow: "auto" }}>
                        <Outlet />
                    </Box>
                </Box>
            </Box>

            {/* 상담 드로어 + 지식 편집 창 (앱 전체에 하나만) */}
            <ChatbotHostView />
        </ExampleChatbotProvider>
    );
}

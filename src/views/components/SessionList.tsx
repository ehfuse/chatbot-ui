import { Box, IconButton, List, ListItemButton, ListItemText } from "@mui/material";
import { OverlayScrollbar } from "@ehfuse/overlay-scrollbar";
import { TrashIcon } from "../../internal/icons";
import { useChatbotController } from "../../controllers/chatbotController";
import { toPlainPreview } from "../../utils/markdownText";
import type { ChatSessionSummary } from "../../types";

/** 이전 대화 목록 화면 — 선택 시 해당 세션을 연다. */
export function SessionList() {
    const { state } = useChatbotController();
    const rawSessions = state.useValue("sessions") as ChatSessionSummary[] | undefined;
    const sessions = rawSessions ?? [];

    return (
        <OverlayScrollbar
            style={{ flex: 1, minHeight: 0 }}
            // 스크롤러 콘텐츠도 flex 아이템이라 기본 min-width:auto 로 두면 nowrap 부제 길이만큼
            // max-content 로 벌어져 가로 스크롤이 생긴다(안쪽 말줄임이 걸려도 소용없다).
            contentStyle={{ minWidth: 0 }}
        >
            <Box sx={{ flexShrink: 0, minWidth: 0 }}>
                {sessions.length === 0 && (
                    <Box sx={{ color: "#444", fontSize: "14px", textAlign: "center", mt: 4 }}>
                        이전 대화가 없습니다.
                    </Box>
                )}
                <List disablePadding>
                    {sessions.map((session) => (
                        <ListItemButton
                            key={session.seq}
                            divider
                            onClick={() => void state.actions.openSession(session.seq)}
                        >
                            <ListItemText
                                primary={toPlainPreview(session.title || "") || "상담"}
                                // 마지막 메시지는 마크다운 원문이라 기호를 걷어내고 한 줄로 보여준다.
                                secondary={
                                    toPlainPreview(session.last_message || "") || `메시지 ${session.message_count}건`
                                }
                                // flex 자식의 기본 min-width:auto 는 내용 폭(max-content)까지 벌어져
                                // 안쪽 말줄임 규칙이 걸려도 목록이 옆으로 밀려난다 → 0 으로 눌러 줄어들게 한다.
                                sx={{ minWidth: 0, my: 0 }}
                                slotProps={{
                                    primary: {
                                        sx: {
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        },
                                    },
                                    secondary: {
                                        sx: {
                                            fontSize: "13.5px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        },
                                    },
                                }}
                            />
                            <IconButton
                                size="small"
                                aria-label="대화 삭제"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    void state.actions.removeSession(session.seq);
                                }}
                                sx={{ flexShrink: 0, ml: 1 }}
                            >
                                <TrashIcon fontSize="small" />
                            </IconButton>
                        </ListItemButton>
                    ))}
                </List>
            </Box>
        </OverlayScrollbar>
    );
}

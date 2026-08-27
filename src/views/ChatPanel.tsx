import { useState } from "react";
import { Badge, Box, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { CommentBubbleIcon } from "@ehfuse/taskbox";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useChatbotController } from "../controllers/chatbotController";
import { useChatbotConfig, useIsTrainer } from "../ChatbotProvider";
import { useChatRealtime } from "../apis/chatRealtime";
import type { ChatMessage } from "../types";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";
import { SessionList } from "./components/SessionList";
import { InquiryPanel } from "./components/InquiryPanel";

/** 상담 화면 패널 props — 드로어와 팝업 창이 같은 본문을 공유한다. */
interface ChatPanelProps {
    /** 닫기 버튼 동작. 없으면 닫기 버튼을 표시하지 않는다(팝업 창). */
    onClose?: () => void;
    /** 새 창(팝업)으로 열기 동작. 없으면 새 창 버튼을 표시하지 않는다(이미 팝업인 경우). */
    onOpenPopup?: () => void;
}

/** 상담 제목바 + 본문(대화/이전대화/문의) — 드로어·팝업 공용 패널이다. */
export function ChatPanel({ onClose, onOpenPopup }: ChatPanelProps) {
    const { state } = useChatbotController();
    const view = state.useValue("view") as "chat" | "sessions" | "inquiry" | "inquiries";
    // "내 문의" 목록 화면은 소비처가 넘겨 준다 — 안 넘어오면 그 화면도 진입 버튼도 없다.
    const { renderMyInquiries, myInquiryBadgeCount } = useChatbotConfig();
    // 목록 화면을 넘겨받았을 때만 진입 버튼을 낸다(본사처럼 목록이 필요 없는 계정은 소비처가 안 넘긴다).
    const showMyInquiries = typeof renderMyInquiries === "function";
    const inquiryBadge = Math.max(0, Number(myInquiryBadgeCount ?? 0));
    // 폰 제목바 ⋮ 메뉴의 기준 요소 — 넓은 화면에서는 쓰지 않는다.
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    // 교육자 계정이면 대화가 학습(지식 수집) 모드로 동작함을 제목에 표시한다.
    const isTrainer = useIsTrainer();
    // 드로어가 화면을 꽉 채우는 폭(sm 미만 — ChatbotDrawer 의 width: xs=100% 와 같은 기준)에서는
    // 페이지처럼 보이므로 우측 X 대신 좌측 ← 로 닫는다. 옆 패널로 뜨는 폭에서는 X 를 그대로 쓴다.
    const theme = useTheme();
    const isFullWidth = useMediaQuery(theme.breakpoints.down("sm"));

    // 제목바 왼쪽 ← 의 동작 — 제목 텍스트도 같은 동작을 쓴다(둘이 어긋나지 않게 한 곳에서 정한다).
    // 대화가 아닌 화면(이전 대화·고객센터 등록)에서는 대화로 돌아가고,
    // 대화 화면에서는 전체 폭일 때만 닫기가 된다(옆 패널로 뜰 때는 우측 X 를 쓴다).
    const backAction =
        view !== "chat" ? () => state.setValue("view", "chat") : isFullWidth && onClose ? onClose : undefined;
    const backLabel = view !== "chat" ? "뒤로" : "닫기";

    // 스트리밍 청크/완료/오류/추가 메시지를 상태에 반영한다 (패널이 항상 마운트되어 수신 누락 없음).
    useChatRealtime({
        onChunk: (data) => {
            if (!data || data.conversation_seq !== state.getValue("conversationSeq")) return;
            const current = state.getValue("streaming");
            state.setValue("streaming", {
                messageIndex: data.message_index,
                text: `${current?.text ?? ""}${data.delta}`,
            });
        },
        onDone: (data) => {
            if (!data || data.conversation_seq !== state.getValue("conversationSeq")) return;
            state.setValue("messages", [...state.getValue("messages"), data.message as ChatMessage]);
            state.setValue("streaming", null);
            state.setValue("sending", false);
        },
        onMessage: (data) => {
            if (!data || data.conversation_seq !== state.getValue("conversationSeq")) return;
            state.setValue("messages", [...state.getValue("messages"), data.message as ChatMessage]);
        },
        onError: (data) => {
            if (!data || data.conversation_seq !== state.getValue("conversationSeq")) return;
            state.setValue("streaming", null);
            state.setValue("sending", false);
            state.setValue("messages", [
                ...state.getValue("messages"),
                { role: "assistant", content: data.error || "답변 생성에 실패했습니다. 다시 시도해주세요." },
            ]);
        },
    });

    return (
        <>
            {/* 제목바 */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid #e0e0e0",
                    flexShrink: 0,
                }}
            >
                {backAction ? (
                    <IconButton size="small" aria-label={backLabel} onClick={backAction}>
                        <ArrowBackIcon />
                    </IconButton>
                ) : (
                    <SmartToyOutlinedIcon sx={{ color: "primary.main" }} />
                )}
                {/* 제목도 ← 와 같은 동작으로 누를 수 있게 한다(작은 아이콘만 노리지 않아도 되게).
                    키보드 조작은 옆 ← 버튼이 담당하므로 여기에 탭 정지점을 더 만들지 않는다. */}
                <Box
                    onClick={backAction}
                    sx={{
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        flex: 1,
                        cursor: backAction ? "pointer" : "default",
                        userSelect: "none",
                    }}
                >
                    {view === "sessions"
                        ? "이전 대화"
                        : view === "inquiries"
                          ? "내 문의"
                          : view === "inquiry"
                            ? "고객센터 등록"
                            : `상담하기${isTrainer ? " (학습모드)" : ""}`}
                </Box>
                {/* 제목바 액션 — 대화 화면에서만. 폰은 제목바가 좁아 ⋮ 한 칸에 모으고, 그보다 넓으면 아이콘을 나열한다. */}
                {view === "chat" &&
                    (isFullWidth ? (
                        <>
                            <Badge
                                badgeContent={showMyInquiries ? inquiryBadge : 0}
                                color="error"
                                max={99}
                                sx={{ "& .MuiBadge-badge": { fontSize: 10, minWidth: 16, height: 16 } }}
                            >
                                <IconButton
                                    size="small"
                                    aria-label="메뉴"
                                    onClick={(event) => setMenuAnchor(event.currentTarget)}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                            </Badge>
                            <Menu
                                anchorEl={menuAnchor}
                                open={Boolean(menuAnchor)}
                                onClose={() => setMenuAnchor(null)}
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                transformOrigin={{ vertical: "top", horizontal: "right" }}
                            >
                                <MenuItem
                                    onClick={() => {
                                        setMenuAnchor(null);
                                        void state.actions.startNewSession();
                                    }}
                                >
                                    <ListItemIcon>
                                        <CommentBubbleIcon sx={{ fontSize: 20, "& path": { strokeWidth: 4.5 } }} />
                                    </ListItemIcon>
                                    새 대화
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        setMenuAnchor(null);
                                        void state.actions.openSessionList();
                                    }}
                                >
                                    <ListItemIcon>
                                        <HistoryOutlinedIcon fontSize="small" />
                                    </ListItemIcon>
                                    이전 대화
                                </MenuItem>
                                {showMyInquiries && (
                                    <MenuItem
                                        onClick={() => {
                                            setMenuAnchor(null);
                                            state.setValue("view", "inquiries");
                                        }}
                                    >
                                        <ListItemIcon>
                                            <ListAltOutlinedIcon fontSize="small" />
                                        </ListItemIcon>
                                        내 문의보기
                                        {inquiryBadge > 0 && (
                                            <Box
                                                component="span"
                                                sx={{
                                                    ml: 1.5,
                                                    px: 0.75,
                                                    borderRadius: 999,
                                                    bgcolor: "error.main",
                                                    color: "#fff",
                                                    fontSize: 11,
                                                    lineHeight: "16px",
                                                }}
                                            >
                                                {inquiryBadge > 99 ? "99+" : inquiryBadge}
                                            </Box>
                                        )}
                                    </MenuItem>
                                )}
                            </Menu>
                        </>
                    ) : (
                        <>
                            {showMyInquiries && (
                                <Tooltip title="내 문의">
                                    <Badge
                                        badgeContent={inquiryBadge}
                                        color="error"
                                        max={99}
                                        sx={{ "& .MuiBadge-badge": { fontSize: 10, minWidth: 16, height: 16 } }}
                                    >
                                        <IconButton
                                            size="small"
                                            aria-label="내 문의"
                                            onClick={() => state.setValue("view", "inquiries")}
                                        >
                                            <ListAltOutlinedIcon />
                                        </IconButton>
                                    </Badge>
                                </Tooltip>
                            )}
                            <Tooltip title="새 대화">
                                <IconButton
                                    size="small"
                                    onClick={() => void state.actions.startNewSession()}
                                    aria-label="새 대화"
                                >
                                    {/* 업무함 제목의 댓글 말풍선 아이콘과 동일한 아이콘 — 작게 쓰므로 스트로크를 더 두껍게. */}
                                    <CommentBubbleIcon sx={{ fontSize: 20, "& path": { strokeWidth: 4.5 } }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="이전 대화">
                                <IconButton
                                    size="small"
                                    onClick={() => void state.actions.openSessionList()}
                                    aria-label="이전 대화"
                                >
                                    <HistoryOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    ))}
                {onOpenPopup && (
                    <Tooltip title="새 창으로 열기">
                        {/* 대화창을 띄워 둔 채로 사이트를 계속 쓰기 위한 팝업 창 — 모바일에서는 숨긴다. */}
                        <IconButton
                            size="small"
                            onClick={onOpenPopup}
                            aria-label="새 창으로 열기"
                            sx={{ display: { xs: "none", sm: "inline-flex" } }}
                        >
                            <OpenInNewIcon />
                        </IconButton>
                    </Tooltip>
                )}
                {/* 우측 X — 옆 패널로 뜰 때만. 전체 폭에서는 위 좌측 ← 가 닫기 역할을 한다. */}
                {onClose && !isFullWidth && (
                    <IconButton size="small" onClick={onClose} aria-label="닫기">
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            {/* 본문 — 화면 전환 (대화 / 이전 대화 / 내 문의 / 문의 등록) */}
            {view === "sessions" ? (
                <SessionList />
            ) : view === "inquiries" ? (
                // 목록 화면은 소비처가 넘겨 준다 — 아이콘은 renderMyInquiries 가 있을 때만 뜨므로 여기서는 그대로 그린다.
                renderMyInquiries?.()
            ) : view === "inquiry" ? (
                <InquiryPanel />
            ) : (
                <>
                    <MessageList />
                    <ChatInput />
                </>
            )}
        </>
    );
}

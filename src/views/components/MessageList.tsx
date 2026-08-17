import { Fragment, useCallback, useEffect, useRef } from "react";
import { Box, CircularProgress, List, ListItemButton, ListItemText } from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import { OverlayScrollbar } from "@ehfuse/overlay-scrollbar";
import type { OverlayScrollbarRef } from "@ehfuse/overlay-scrollbar";
import { useIsTrainer } from "../../ChatbotProvider";
import { useChatbotController } from "../../controllers/chatbotController";
import type { ChatMessage, ChatOption, ChatSessionSummary } from "../../types";
import { BotLabel } from "./BotLabel";
import { MessageBubble } from "./MessageBubble";
import { MarkdownContent } from "./MarkdownContent";
import { toPlainPreview } from "../../utils/markdownText";
import {
    CHAT_LIST_BACKGROUND_COLOR,
    CHAT_LIST_PATTERN_IMAGE,
    CHAT_LIST_PATTERN_POSITION,
    CHAT_LIST_PATTERN_SIZE,
} from "../../internal/chatListStyle";
import { ChatDateLabel } from "../../internal/ChatDateLabel";
import { formatRecordFullDateLabel } from "../../internal/recordTime";
import { formatSessionTimeLabel, shouldShowDateDivider } from "../../utils/messageTime";

/** 인사화면에 바로가기로 띄우는 최근 대화 개수. 이보다 많으면 "모두 보기"로 전체 목록을 연다. */
const RECENT_SESSION_LIMIT = 5;

/** 드로어 슬라이드 전환이 끝난 뒤 하단 정렬을 한 번 더 맞추는 지연(ms). MUI Drawer 기본 전환보다 넉넉히 잡는다. */
const DRAWER_SETTLE_SCROLL_DELAY_MS = 320;

/** 메시지 목록 — 세션 메시지 + 스트리밍 중 답변을 렌더하고 항상 하단으로 스크롤한다. */
export function MessageList() {
    const { state } = useChatbotController();
    const rawMessages = state.useValue("messages") as ChatMessage[] | undefined;
    const messages = rawMessages ?? [];
    const streaming = state.useValue("streaming") as { messageIndex: number; text: string } | null;
    const sending = state.useValue("sending") as boolean;
    const conversationSeq = state.useValue("conversationSeq") as number | null;
    const rawSessions = state.useValue("sessions") as ChatSessionSummary[] | undefined;
    // 인사화면 바로가기는 실제로 오간 대화만 보여준다 (막 만들어진 빈 세션은 이어갈 내용이 없다).
    const usableSessions = (rawSessions ?? []).filter((session) => session.message_count > 0);
    const recentSessions = usableSessions.slice(0, RECENT_SESSION_LIMIT);
    const hasMoreSessions = usableSessions.length > RECENT_SESSION_LIMIT;
    const isDrawerOpen = state.useValue("isDrawerOpen") as boolean | undefined;
    // 근거 지식 표시는 교육자 전용이다 — 말풍선마다 계정을 구독하지 않게 여기서 한 번만 판정한다.
    const isTrainer = useIsTrainer();
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const scrollbarRef = useRef<OverlayScrollbarRef | null>(null);

    /** 목록을 실제 스크롤 끝까지 내린다 (OverlayScrollbar 컨테이너 기준). */
    const scrollToBottom = useCallback(() => {
        const container = scrollbarRef.current?.getScrollContainer();
        if (container) {
            container.scrollTop = container.scrollHeight;
            return;
        }
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, []);

    // 새 메시지/청크 수신 시 하단으로 따라간다.
    // 커밋 직후에는 브라우저가 새 내용을 아직 배치하지 않아 옛 높이로 스크롤된다 —
    // 페인트 뒤(rAF)에 한 번 더 맞춰야 답변 말풍선(선택지·피드백 포함) 끝까지 내려간다.
    useEffect(() => {
        scrollToBottom();
        const frameId = window.requestAnimationFrame(scrollToBottom);
        return () => window.cancelAnimationFrame(frameId);
    }, [messages.length, streaming?.text, sending, scrollToBottom]);

    // 답변에 붙은 근거 이미지는 로드된 뒤에야 높이가 잡혀 목록이 다시 길어진다.
    // 마지막 메시지의 이미지가 뜨는 시점에만 따라 내려간다(사용자가 위를 보는 중이면 건드리지 않게 마지막 것만).
    const lastMessage = messages[messages.length - 1];
    const lastImageCount = (lastMessage?.image_uuids?.length ?? 0) + (lastMessage?.local_image_urls?.length ?? 0);
    useEffect(() => {
        if (lastImageCount === 0) return;
        const container = scrollbarRef.current?.getScrollContainer();
        const images = Array.from(container?.querySelectorAll("img") ?? []).filter((image) => !image.complete);
        if (images.length === 0) return;
        images.forEach((image) => image.addEventListener("load", scrollToBottom, { once: true }));
        return () => images.forEach((image) => image.removeEventListener("load", scrollToBottom));
    }, [messages.length, lastImageCount, scrollToBottom]);

    // 드로어가 다시 열리면 항상 맨 아래에서 시작한다 (keepMounted 라 이전 스크롤 위치가 남는다).
    // 슬라이드 애니메이션이 끝나야 높이가 확정되고 이전 세션 메시지도 그 사이 도착하므로,
    // 페인트 직후 한 번 + 전환 완료 후 한 번 맞춘다.
    useEffect(() => {
        if (isDrawerOpen !== true) return;
        const frameId = window.requestAnimationFrame(scrollToBottom);
        const timerId = window.setTimeout(scrollToBottom, DRAWER_SETTLE_SCROLL_DELAY_MS);
        return () => {
            window.cancelAnimationFrame(frameId);
            window.clearTimeout(timerId);
        };
    }, [isDrawerOpen, scrollToBottom]);

    /** 선택지 클릭 → 그 값을 사용자 메시지로 전송한다. */
    const handleSelectOption = (option: ChatOption) => {
        void state.actions.sendMessage(option.value, [], true, option.label);
    };

    // 마지막 assistant 인덱스 — 그 답변의 선택지만 활성화한다.
    let lastAssistantIndex = -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
        if (messages[index].role === "assistant") {
            lastAssistantIndex = index;
            break;
        }
    }

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                // 대화 배경은 전달사항 목록과 동일한 바탕색·패턴을 쓴다.
                backgroundColor: CHAT_LIST_BACKGROUND_COLOR,
                backgroundImage: CHAT_LIST_PATTERN_IMAGE,
                backgroundRepeat: "repeat",
                backgroundSize: CHAT_LIST_PATTERN_SIZE,
                backgroundPosition: CHAT_LIST_PATTERN_POSITION,
            }}
        >
            <OverlayScrollbar
                ref={scrollbarRef}
                style={{ height: "100%" }}
                // nowrap 말줄임(이어가기 부제)이 콘텐츠 flex 아이템을 max-content 폭으로 벌리지 않게 한다.
                contentStyle={{ minWidth: 0 }}
                track={{ alignment: "outside" }}
                thumb={{ width: 10 }}
                // 드래그 스크롤이 켜져 있으면 말풍선 텍스트를 끌어서 선택할 수 없다(복사 불가).
                dragScroll={{ enabled: false }}
            >
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0,
                        minHeight: "100%",
                        backgroundColor: CHAT_LIST_BACKGROUND_COLOR,
                        backgroundImage: CHAT_LIST_PATTERN_IMAGE,
                        backgroundRepeat: "repeat",
                        backgroundSize: CHAT_LIST_PATTERN_SIZE,
                        backgroundPosition: CHAT_LIST_PATTERN_POSITION,
                    }}
                >
                    {messages.length === 0 && !streaming && (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                mt: 2,
                                gap: 1.5,
                            }}
                        >
                            {/* 로고의 엠블럼(파란 육각형 C)만 간단히 보여준다. */}
                            <Box
                                component="img"
                                src="/codeshop/favicon.svg"
                                alt="codeshop"
                                sx={{ width: 88, height: 88, mt: 1 }}
                            />
                            <Box
                                sx={{
                                    fontSize: "17px",
                                    fontWeight: 700,
                                    letterSpacing: "-0.3px",
                                    mt: 0.5,
                                    color: "#111",
                                }}
                            >
                                안녕하세요, 코드샵 상담 챗봇입니다
                            </Box>
                            <Box sx={{ fontSize: "14px", color: "#3f4b57", lineHeight: 1.7 }}>
                                사용법 · 메뉴 위치 · 상황 대처 · 장애 대응까지
                                <br />
                                무엇이든 물어보세요.
                            </Box>
                            {/* 최근 대화 바로가기 — 그냥 입력하면 새 대화라 "새 대화로 시작하기" 항목은 두지 않는다. */}
                            {recentSessions.length > 0 && (
                                <Box sx={{ width: "95%", mt: 1, textAlign: "left" }}>
                                    <Box sx={{ fontSize: "13.5px", color: "#3f4b57", fontWeight: 500, mb: 0.75, px: 0.5 }}>
                                        최근 대화
                                    </Box>
                                    <List
                                        disablePadding
                                        sx={{
                                            backgroundColor: "#ffffff",
                                            borderRadius: "14px",
                                            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {recentSessions.map((session, index) => (
                                            <ListItemButton
                                                key={session.seq}
                                                divider={index < recentSessions.length - 1 || hasMoreSessions}
                                                onClick={() => void state.actions.openSession(session.seq)}
                                                sx={{ gap: 1.5, py: 1.25 }}
                                            >
                                                <HistoryOutlinedIcon
                                                    sx={{ fontSize: 20, color: "#2563eb", flexShrink: 0 }}
                                                />
                                                <ListItemText
                                                    // flex 아이템 min-width:auto 가 nowrap 부제 폭만큼 벌어지지 않게 0 으로 고정한다.
                                                    sx={{ minWidth: 0, my: 0 }}
                                                    primary={toPlainPreview(session.title || "") || "상담"}
                                                    // 마지막 메시지는 마크다운 원문이라 기호를 걷어내고 한 줄로 보여준다.
                                                    secondary={
                                                        toPlainPreview(session.last_message || "") ||
                                                        `메시지 ${session.message_count}건`
                                                    }
                                                    slotProps={{
                                                        primary: {
                                                            sx: {
                                                                fontSize: "15.5px",
                                                                fontWeight: 500,
                                                                color: "#111",
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                mb: 0.25,
                                                            },
                                                        },
                                                        secondary: {
                                                            sx: {
                                                                fontSize: "13.5px",
                                                                color: "#3f4b57",
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                            },
                                                        },
                                                    }}
                                                />
                                                <Box
                                                    sx={{
                                                        flexShrink: 0,
                                                        // 행 gap(1.5) 위에 더 띄워 제목·미리보기 말줄임과 붙어 보이지 않게 한다.
                                                        ml: 1.5,
                                                        fontSize: "13.5px",
                                                        color: "#4b5765",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {formatSessionTimeLabel(session.updated_time)}
                                                </Box>
                                            </ListItemButton>
                                        ))}
                                        {/* 5개를 넘으면 전체 목록 화면으로 넘긴다(헤더 시계 아이콘과 같은 화면). */}
                                        {hasMoreSessions && (
                                            <ListItemButton
                                                onClick={() => void state.actions.openSessionList()}
                                                sx={{ py: 1 }}
                                            >
                                                <ListItemText
                                                    primary="이전 대화 모두 보기"
                                                    sx={{ my: 0 }}
                                                    slotProps={{
                                                        primary: {
                                                            sx: { fontSize: "13.5px", color: "#2563eb", fontWeight: 500 },
                                                        },
                                                    }}
                                                />
                                            </ListItemButton>
                                        )}
                                    </List>
                                </Box>
                            )}
                        </Box>
                    )}
                    {messages.map((message, index) => (
                        <Fragment key={index}>
                            {/* 전달사항 목록과 동일하게 날짜가 바뀌면 날짜 구분선을 넣는다. */}
                            {shouldShowDateDivider(message.time, messages[index - 1]?.time) && (
                                <Box sx={{ px: 0, pt: index === 0 ? 0.5 : 3, pb: 3 }}>
                                    <ChatDateLabel label={formatRecordFullDateLabel(message.time)} />
                                </Box>
                            )}
                            <MessageBubble
                                message={message}
                                messageIndex={index}
                                conversationSeq={conversationSeq}
                                previousQuestion={findPreviousQuestion(messages, index)}
                                isLastAssistant={index === lastAssistantIndex}
                                sending={sending}
                                showSource={isTrainer}
                                onSelectOption={handleSelectOption}
                            />
                        </Fragment>
                    ))}
                    {/* 대기(전송 직후)와 생성 중을 같은 말풍선 한 형태로 보여준다.
                        첫 청크 도착 여부에 따라 스피너 모양이 바뀌지 않게 하고, 텍스트가 채워질 때 위치도 튀지 않는다. */}
                    {(sending || streaming) && (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                mb: 1.5,
                                // 완성 말풍선(MessageBubble)과 같은 세로 간격 — 답변이 끝날 때 라벨 위치가 튀지 않는다.
                                gap: 0.5,
                            }}
                        >
                            {/* 생성 중에도 "상담봇" 라벨을 미리 보여준다(완성 후 라벨이 생기며 답변이 밀리지 않게). */}
                            <BotLabel />
                            <Box
                                sx={{
                                    // ⚠️ 완성된 말풍선(MessageBubble 래퍼 80%)과 같은 폭이어야 한다 —
                                    // 다르면 답변이 끝나는 순간 말풍선이 늘었다 줄어드는 것처럼 보인다.
                                    maxWidth: "80%",
                                    px: 1.5,
                                    // 완성 말풍선과 같은 세로 여백 — 다르면 답변이 끝날 때 높이도 함께 튄다.
                                    py: 1.5,
                                    borderRadius: "14px 14px 14px 0",
                                    backgroundColor: "#ffffff",
                                    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
                                    // 완성된 말풍선(MessageBubble)과 같은 크기로 둔다 — 스트리밍이 끝날 때 글자 크기가 튀지 않는다.
                                    fontSize: "1rem",
                                    lineHeight: 1.55,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    // 생성 중인 답변도 끌어서 복사할 수 있게 한다(말풍선과 동일).
                                    userSelect: "text",
                                    cursor: "text",
                                }}
                            >
                                {/* 완성 말풍선과 같은 마크다운 렌더러를 써야 생성이 끝나는 순간 글이 재배치되지 않는다. */}
                                {streaming?.text ? (
                                    <MarkdownContent text={streaming.text} />
                                ) : (
                                    <CircularProgress size={16} sx={{ verticalAlign: "middle" }} />
                                )}
                            </Box>
                        </Box>
                    )}
                    <Box ref={bottomRef} />
                </Box>
            </OverlayScrollbar>
        </Box>
    );
}

/** index 답변의 직전 사용자 질문 본문을 찾는다 (피드백 스냅샷용). */
function findPreviousQuestion(messages: ChatMessage[], index: number): string {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
        if (messages[cursor].role === "user") return messages[cursor].content;
    }
    return "";
}

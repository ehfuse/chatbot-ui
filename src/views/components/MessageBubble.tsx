import { Box } from "@mui/material";
import type { ChatMessage, ChatOption } from "../../types";
import { OptionButtons } from "./OptionButtons";
import { BotLabel } from "./BotLabel";
import { SourceKnowledgeLink } from "./SourceKnowledgeLink";
import { FeedbackButtons } from "./FeedbackButtons";
import { MarkdownContent } from "./MarkdownContent";
import { ReplaceCandidateList } from "./ReplaceCandidateList";
import { formatRecordTimeLabel } from "../../internal/recordTime";
import { useChatImageViewer } from "../../utils/chatImageViewer";

/** 말풍선 props */
interface MessageBubbleProps {
    message: ChatMessage; // 메시지
    messageIndex: number; // 세션 내 인덱스
    conversationSeq: number | null; // 세션 seq
    previousQuestion: string; // 직전 사용자 질문 (피드백 스냅샷용)
    isLastAssistant: boolean; // 마지막 답변 여부 (선택지 활성 기준)
    showSource: boolean; // 근거 지식 표시 여부 (교육자에게만 보인다)
    sending: boolean; // 전송 중 여부
    onSelectOption: (option: ChatOption) => void; // 선택지 클릭
}

/** 대화 말풍선 — 사용자(오른쪽 파랑)/챗봇(왼쪽 회색), 이미지·선택지·피드백 포함. */
export function MessageBubble({
    message,
    messageIndex,
    conversationSeq,
    previousQuestion,
    isLastAssistant,
    sending,
    showSource,
    onSelectOption,
}: MessageBubbleProps) {
    const openChatImageViewer = useChatImageViewer();
    const isUser = message.role === "user";
    // 말풍선 본체와 꼬리가 같은 색이어야 이어져 보인다.
    const bubbleColor = isUser ? "#e3f7d3" : "#ffffff";
    // 선택지 버튼 클릭으로 보낸 메시지는 원문 대신 라벨처럼 짧게 보인다 (#kb: 명령은 라벨을 알 수 없어 안내문으로).
    const displayContent = isUser && message.content.startsWith("#kb:") ? "(선택지 응답)" : message.content;
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                mb: 1.5,
                gap: 0.5,
            }}
        >
            {!isUser && <BotLabel />}
            {/* 말풍선 + 시간 라벨 — 사용자는 왼쪽, 챗봇은 오른쪽에 시간을 붙인다. */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 0.75,
                    maxWidth: "80%",
                    flexDirection: isUser ? "row-reverse" : "row",
                }}
            >
                <Box
                    sx={{
                        // 시간 라벨이 같은 줄의 폭을 나눠 쓰므로 말풍선 자체는 남는 폭을 최대한 쓴다.
                        minWidth: 0,
                        px: 1.5,
                        py: 1.5,
                        // 아래쪽 한 모서리만 각지게(radius 0) 둔다.
                        borderRadius: isUser ? "14px 14px 0 14px" : "14px 14px 14px 0",
                        // 내 말풍선은 연한 연두, 챗봇은 흰색 (텔레그램식 배색).
                        backgroundColor: bubbleColor,
                        color: "#111",
                        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
                        fontSize: "1rem",
                        lineHeight: 1.55,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        // 대시보드 전역 user-select:none 을 여기서만 풀어 답변을 끌어서 복사할 수 있게 한다.
                        userSelect: "text",
                        cursor: "text",
                    }}
                >
                    {/* 챗봇 답변만 마크다운으로 렌더한다 — 사용자가 친 글은 입력한 그대로 보여야 한다
                        (예: "**" 를 그대로 쓴 질문이 굵게 바뀌어 버리면 안 된다). */}
                    {isUser ? displayContent : <MarkdownContent text={displayContent} />}
                    {/* 첨부 이미지 — 말풍선에는 md 썸네일만 싣고(안내용으로 충분), 클릭하면 원본을 뷰어로 연다.
                        방금 보낸 낙관적 말풍선은 아직 UUID 가 없어 로컬 data URL 을 그대로 쓴다. */}
                    {[
                        ...(message.image_uuids ?? []).map((uuid) => ({
                            thumb: `/api/v1/files/${uuid}?thumb=md`,
                            full: `/api/v1/files/${uuid}`,
                        })),
                        ...(message.local_image_urls ?? []).map((url) => ({ thumb: url, full: url })),
                    ].map((image, imageIndex) => (
                        <Box
                            key={image.thumb}
                            component="img"
                            src={image.thumb}
                            alt="첨부 이미지"
                            title="클릭하면 원본을 크게 볼 수 있습니다"
                            onClick={() => openChatImageViewer(image.full, imageIndex)}
                            sx={{
                                display: "block",
                                maxWidth: "100%",
                                borderRadius: 1,
                                mt: 1.5,
                                // 클릭하면 크게 열리므로 손가락 커서로 클릭 가능함을 알린다.
                                cursor: "pointer",
                            }}
                        />
                    ))}
                    {/* 어떤 지식을 보고 답했는지 — 엉뚱한 근거가 잡혔을 때 바로 열어 고칠 수 있게 한다. */}
                    {!isUser && showSource ? (
                        <SourceKnowledgeLink knowledgeSeq={message.knowledge_seq} faqSeq={message.faq_seq} />
                    ) : null}
                </Box>
                {message.time ? (
                    <Box sx={{ flexShrink: 0, fontSize: "12px", color: "#4b5765", pb: 0.25, whiteSpace: "nowrap" }}>
                        {formatRecordTimeLabel(message.time)}
                    </Box>
                ) : null}
            </Box>
            {!isUser && message.options && message.options.length > 0 && (
                <OptionButtons
                    options={message.options}
                    selectedValue={undefined}
                    disabled={!isLastAssistant || sending}
                    onSelect={onSelectOption}
                />
            )}
            {/* 정정 후보 — 기존 지식을 펼쳐 확인하고 하나를 골라 수정한다. */}
            {!isUser && (message.replace_candidates?.length ?? 0) > 0 && (
                <ReplaceCandidateList
                    candidates={message.replace_candidates ?? []}
                    draftSeq={Number(message.replace_draft_seq) || 0}
                    disabled={sending}
                    onPick={(value) => onSelectOption({ label: "수정하기", value })}
                />
            )}
            {!isUser && conversationSeq != null && (
                <FeedbackButtons
                    conversationSeq={conversationSeq}
                    messageIndex={messageIndex}
                    savedRating={message.my_rating}
                    question={previousQuestion}
                    answer={message.content}
                    knowledgeSeq={message.knowledge_seq}
                    faqSeq={message.faq_seq}
                />
            )}
        </Box>
    );
}

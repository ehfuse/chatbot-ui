import { Box, IconButton, Tooltip } from "@mui/material";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { saveAnswerFeedback } from "../../apis/chatbotApi";
import { useChatbotController } from "../../controllers/chatbotController";

/** 피드백 버튼 props */
interface FeedbackButtonsProps {
    conversationSeq: number; // 세션 seq
    messageIndex: number; // 답변 메시지 인덱스
    savedRating?: "good" | "bad"; // 서버에 저장된 내 평가(대화를 다시 열었을 때 복원용)
    question: string; // 직전 질문 본문 (스냅샷)
    answer: string; // 답변 본문 (스냅샷)
    knowledgeSeq?: number; // 답변 근거 지식
    faqSeq?: number; // 답변 근거 FAQ
}

/** 답변 말풍선의 👍/👎 — 만족도 수집 전용, 지식 소스는 바꾸지 않는다(5.5). */
export function FeedbackButtons({
    conversationSeq,
    messageIndex,
    savedRating,
    question,
    answer,
    knowledgeSeq,
    faqSeq,
}: FeedbackButtonsProps) {
    // 표시 기준은 두 가지다.
    //  ① savedRating — 서버가 메시지에 얹어 준 저장된 평가(대화를 다시 열었을 때 복원)
    //  ② 방금 누른 값 — 전역 상태에 담아 저장 응답을 기다리지 않고 바로 반영한다.
    const { state } = useChatbotController();
    const clickedRaw = state.useValue(`feedbackByIndex.${messageIndex}`) as "good" | "bad" | undefined;
    const rating = clickedRaw ?? savedRating ?? null;

    /** 평가를 저장한다 (재클릭 무시). */
    const handleRate = (value: "good" | "bad") => {
        if (rating) return;
        state.setValue(`feedbackByIndex.${messageIndex}`, value);
        void saveAnswerFeedback({
            conversationSeq,
            messageIndex,
            rating: value,
            knowledgeSeq,
            faqSeq,
            question,
            answer,
            // 저장에 실패하면 표시를 되돌린다(서버에 없는 평가가 남지 않게).
        }).catch(() => state.setValue(`feedbackByIndex.${messageIndex}`, undefined));
    };

    return (
        <Box sx={{ display: "flex", gap: 0.25, mt: 0.5 }}>
            <Tooltip title="도움이 됐어요">
                <span>
                    <IconButton size="small" disabled={rating === "bad"} onClick={() => handleRate("good")} sx={{ color: rating === "good" ? "#2563eb" : "#64748b" }}>
                        {rating === "good" ? <ThumbUpIcon sx={{ fontSize: 16 }} /> : <ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="도움이 안 됐어요">
                <span>
                    <IconButton size="small" disabled={rating === "good"} onClick={() => handleRate("bad")} sx={{ color: rating === "bad" ? "#dc2626" : "#64748b" }}>
                        {rating === "bad" ? <ThumbDownIcon sx={{ fontSize: 16 }} /> : <ThumbDownOutlinedIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                </span>
            </Tooltip>
        </Box>
    );
}

/**
 * AnswerDraftDialog.tsx
 *
 * 지식 답변 초안 다이얼로그.
 * 왼쪽에 교육자가 실제 해결 방법을 적고 [생성하기]를 누르면, 오른쪽에 AI 가 다듬은 안내문이 나온다.
 * 좌우를 비교해 확인한 뒤 [확인]을 눌러야 지식 본문이 교체된다(자동 반영하지 않는다).
 *
 * 고객센터 이관 후보처럼 본문이 "질문/문제 서술"인 지식을 그대로 승인하면 RAG 에 오답 근거가 들어가므로,
 * 승인 전에 본문을 답변으로 바꾸는 자리를 명시적으로 만든 것이다.
 */
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { TextField } from "@ehfuse/mui-form-controls";
import { useDialogBackClose } from "../../../internal/useDialogBackClose";
import { MarkdownContent } from "../../components/MarkdownContent";
import type { useChatbotManageController } from "../../../controllers/manageController";

/** 답변 초안 다이얼로그 props 타입이다. */
interface AnswerDraftDialogProps {
    controller: ReturnType<typeof useChatbotManageController>; // 챗봇 관리 컨트롤러
    title: string; // 지식 제목(직원이 실제로 물어본 질문)
    situation: string; // 현재 본문(이관 후보면 문제 서술) — 배경 참고용
    onApply: (draft: string) => void; // 확인 — 생성된 본문을 지식에 반영한다
}

/** 좌우 패널 공통 라벨 스타일이다. */
const panelLabelSx = { fontSize: "13.5px", fontWeight: 700, color: "#111827", mb: 0.75 } as const;

/** 지식 답변 초안 다이얼로그 컴포넌트다. */
export function AnswerDraftDialog({ controller, title, situation, onApply }: AnswerDraftDialogProps) {
    const { state, modals } = controller;
    const open = modals.answerDraft.isOpen;
    const notes = (state.useValue("answerDraftNotes") as string | undefined) ?? "";
    const draft = (state.useValue("answerDraftResult") as string | undefined) ?? "";
    const loading = (state.useValue("answerDraftLoading") as boolean | undefined) ?? false;

    /** 다이얼로그를 닫고 입력·결과를 비운다. */
    const handleClose = () => {
        modals.answerDraft.close();
        state.setValue("answerDraftNotes", "");
        state.setValue("answerDraftResult", "");
    };

    // 기기 뒤로가기로 이 다이얼로그만 닫히게 한다.
    const { requestClose } = useDialogBackClose({ open, onClose: handleClose, modalId: "chatbot-answer-draft-dialog" });

    /** 확인 — 생성된 본문을 지식에 반영하고 닫는다. */
    const handleApply = () => {
        onApply(draft);
        // 반영 콜백이 이미 이 다이얼로그를 닫힘 상태로 만들지 않으므로 여기서 닫는다.
        handleClose();
    };

    return (
        <Dialog
            open={open}
            onClose={(_event, reason) => {
                // 작성 중인 내용을 백드롭 클릭으로 날리지 않는다.
                if (reason === "backdropClick") return;
                requestClose();
            }}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle sx={{ fontSize: "17px", fontWeight: 700 }}>답변 생성</DialogTitle>
            <DialogContent dividers>
                <Typography sx={{ fontSize: "13.5px", color: "#374151", mb: 2 }}>
                    이 지식의 본문은 아직 질문(문제 상황)입니다. 실제 해결 방법을 적고 [생성하기]를 누르면 현장 직원이
                    따라할 수 있는 안내문으로 다듬어 드립니다. 오른쪽 결과를 확인한 뒤 [확인]을 눌러야 본문이 바뀝니다.
                </Typography>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: 2,
                        alignItems: "start",
                    }}
                >
                    <Box>
                        <Typography sx={panelLabelSx}>해결 방법 (교육자 입력)</Typography>
                        <TextField
                            multiline
                            minRows={14}
                            maxRows={22}
                            fullWidth
                            placeholder={
                                "확인된 사실만 적어 주세요. 문장이 거칠어도 괜찮습니다.\n" +
                                "예) 이용신청서 첨부서류는 저장 후에도 바꿀 수 있다. 서류 탭에서 파일 오른쪽 x 로 지우고 다시 올리면 된다.\n" +
                                "전자결재는 상신하면 첨부를 못 바꾸고 회수해야 한다."
                            }
                            value={notes}
                            onChange={(event) => state.setValue("answerDraftNotes", event.target.value)}
                        />
                        <Typography sx={{ fontSize: "12.5px", color: "#4b5563", mt: 0.75 }}>
                            여기에 적은 내용만 근거로 씁니다. 적지 않은 절차는 지어내지 않습니다.
                        </Typography>
                    </Box>
                    <Box>
                        <Typography sx={panelLabelSx}>생성된 본문 (미리보기)</Typography>
                        <Box
                            sx={{
                                minHeight: 340,
                                maxHeight: 460,
                                overflowY: "auto",
                                border: "1px solid #e5e7eb",
                                borderRadius: 1,
                                p: 1.5,
                                bgcolor: "#fbfbfa",
                                fontSize: "15px",
                                lineHeight: 1.7,
                            }}
                        >
                            {loading ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#4b5563", fontSize: "15px" }}>
                                    <CircularProgress size={18} />
                                    안내문을 만드는 중입니다…
                                </Box>
                            ) : draft ? (
                                <MarkdownContent text={draft} />
                            ) : (
                                <Typography sx={{ fontSize: "15px", color: "#6b7280" }}>
                                    왼쪽에 해결 방법을 적고 [생성하기]를 누르세요.
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button color="inherit" onClick={requestClose} disabled={loading}>
                    취소
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => void state.actions.generateAnswerDraft({ title, situation })}
                    disabled={loading || !notes.trim()}
                >
                    {loading ? <CircularProgress size={18} color="inherit" /> : draft ? "다시 생성" : "생성하기"}
                </Button>
                <Button variant="contained" onClick={handleApply} disabled={loading || !draft}>
                    확인
                </Button>
            </DialogActions>
        </Dialog>
    );
}

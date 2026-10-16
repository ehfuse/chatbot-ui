import { useEffect, useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import { OverlayScrollbar } from "@ehfuse/overlay-scrollbar";
import { useChatbotController } from "../../controllers/chatbotController";
import type { InquiryDraft } from "../../types";
import { useChatbotText } from "../../ChatbotProvider";
import { fillText } from "../../i18n/chatbotText";

/** 고객센터 문의 초안 확인/수정 화면 — 사용자가 확인해야만 등록된다(5.7 임의 등록 금지). */
export function InquiryPanel() {
    const t = useChatbotText();
    const { state } = useChatbotController();
    const draft = state.useValue("inquiryDraft") as InquiryDraft | null;
    const sending = state.useValue("sending") as boolean;
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    // 초안 도착 시 편집 값을 시드한다.
    useEffect(() => {
        if (draft) {
            setTitle(draft.title);
            setContent(draft.content);
        }
    }, [draft]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <OverlayScrollbar style={{ flex: 1, minHeight: 0 }}>
                <Box sx={{ px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 2.5, flexShrink: 0 }}>
                    <Box sx={{ lineHeight: 1.6 }}>{t.inquiryCheck}</Box>
                    <TextField
                        label={t.title}
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        fullWidth
                    />
                    <TextField
                        label={t.content}
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        fullWidth
                        multiline
                        minRows={10}
                        sx={{ "& textarea": { lineHeight: 1.6 } }}
                    />
                    {(draft?.image_uuids?.length ?? 0) > 0 && (
                        <Box sx={{ color: "#444" }}>
                            {fillText(t.inquiryImages, { n: draft?.image_uuids.length ?? 0 })}
                        </Box>
                    )}
                </Box>
            </OverlayScrollbar>
            <Box sx={{ display: "flex", gap: 1, p: 1.5, borderTop: "1px solid #e0e0e0", flexShrink: 0 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    disabled={sending}
                    onClick={() => {
                        state.setValue("inquiryDraft", null);
                        state.setValue("view", "chat");
                    }}
                >
                    {t.cancel}
                </Button>
                <Button
                    fullWidth
                    variant="contained"
                    disabled={sending || !title.trim() || !content.trim()}
                    onClick={() => void state.actions.submitInquiry(title.trim(), content.trim())}
                >
                    {t.register}
                </Button>
            </Box>
        </Box>
    );
}

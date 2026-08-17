import { Drawer } from "@mui/material";
import { useDialogBackClose } from "../internal/useDialogBackClose";
import { useChatbotController } from "../controllers/chatbotController";
import { openChatPopup } from "../utils/chatPopup";
import { useChatbotConfig } from "../ChatbotProvider";
import { ChatPanel } from "./ChatPanel";

/** 헤더 "상담하기" 버튼으로 여는 오른쪽 상담 드로어다 (대화/이전대화/문의 3화면). */
export function ChatbotDrawer() {
    const { state } = useChatbotController();
    const { chatPopupPath } = useChatbotConfig();
    const rawOpen = state.useValue("isDrawerOpen") as boolean | undefined;
    const open = rawOpen === true;

    /** 드로어를 닫는다(뒤로가기로 닫힐 때 useDialogBackClose 가 호출). */
    const handleClose = () => {
        state.setValue("isDrawerOpen", false);
    };

    // 기기 뒤로가기로 드로어만 닫히게 히스토리 칸을 등록한다(전역 단일 인스턴스라 고정 id).
    const { requestClose } = useDialogBackClose({ open, onClose: handleClose, modalId: "chatbot-drawer" });

    /** 대화를 팝업 창으로 옮겨 띄운다 — 창이 열리면 드로어는 닫아 화면을 비운다. */
    const handleOpenPopup = () => {
        if (openChatPopup(chatPopupPath)) requestClose();
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={requestClose}
            keepMounted
            slotProps={{
                paper: {
                    sx: {
                        // 모바일은 전체 폭, 데스크톱은 화면의 35% 를 쓰되 좁은 창에서도 읽히게 최소 폭을 준다.
                        width: { xs: "100%", sm: "35%" },
                        minWidth: { xs: "auto", sm: 480 },
                        maxWidth: "100%",
                        display: "flex",
                        flexDirection: "column",
                    },
                },
            }}
        >
            <ChatPanel onClose={requestClose} onOpenPopup={handleOpenPopup} />
        </Drawer>
    );
}

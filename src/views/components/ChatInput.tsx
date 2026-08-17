import { useEffect, useRef, useState } from "react";
import { Box, IconButton, TextField } from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import { useChatbotController } from "../../controllers/chatbotController";
import type { ChatImageInput } from "../../apis/chatbotApi";

/** 첨부 가능한 이미지 최대 개수. */
const MAX_ATTACH_IMAGE_COUNT = 4;

/** 첨부 대기 이미지 (로컬) */
interface PendingImage {
    name: string; // 파일명
    dataUrl: string; // data URL
}

/** 드로어 하단 입력창 — 이미지 첨부(스크린샷) + 전송. 배치 규칙은 게시판 댓글 입력칸(업무함 기준)을 따른다. */
export function ChatInput() {
    const { state } = useChatbotController();
    const sending = state.useValue("sending") as boolean;
    const [input, setInput] = useState("");
    const [images, setImages] = useState<PendingImage[]>([]);
    const [dropOver, setDropOver] = useState(false);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const textFieldRef = useRef<HTMLTextAreaElement | null>(null);
    const isDrawerOpen = state.useValue("isDrawerOpen") as boolean;
    const view = state.useValue("view") as string;

    // 드로어가 열리거나 대화 화면으로 돌아오면 입력칸에 오토포커스한다 (슬라이드 전환 후 시점).
    useEffect(() => {
        if (!isDrawerOpen || view !== "chat") return;
        const timer = window.setTimeout(() => textFieldRef.current?.focus(), 250);
        return () => window.clearTimeout(timer);
    }, [isDrawerOpen, view]);

    const canSubmit = Boolean(input.trim()) && !sending;

    /** 이미지 파일들을 data URL 로 보관한다 (전송 시 서버가 webp 변환·업로드). */
    const handlePickImageFiles = (files: File[]) => {
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = String(reader.result ?? "");
                if (!dataUrl.startsWith("data:image/")) return;
                // 붙여넣기 이미지는 파일명이 비어 있을 수 있어 기본 이름을 붙인다.
                const fileName = file.name || `clipboard-${file.type.replace("image/", "") || "png"}`;
                // 상한 판정은 항상 최신 목록 기준으로 한다(여러 장 동시 첨부 시 초과 방지).
                setImages((prev) =>
                    prev.length >= MAX_ATTACH_IMAGE_COUNT ? prev : [...prev, { name: fileName, dataUrl }]
                );
            };
            reader.readAsDataURL(file);
        }
    };

    /** 파일 선택/드롭 목록에서 이미지만 골라 첨부한다(설계 5.6 — 동영상/일반 파일 제외). */
    const handlePickImages = (files: FileList | null) => {
        if (!files) return;
        handlePickImageFiles(Array.from(files).filter((file) => file.type.startsWith("image/")));
    };

    /** 전송 — 입력/첨부를 비우고 액션에 넘긴다. */
    const handleSubmit = () => {
        if (!canSubmit) return;
        const payloadImages: ChatImageInput[] = images.map((image) => ({ file_name: image.name, data_url: image.dataUrl }));
        setInput("");
        setImages([]);
        void state.actions.sendMessage(input, payloadImages, false);
    };

    return (
        <Box sx={{ flexShrink: 0 }}>
            {/* 첨부 대기 이미지 — 업무함 댓글 입력칸과 동일하게 정사각 썸네일로 보여준다. */}
            {images.length > 0 && (
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 0.75,
                        px: 2,
                        pt: 1,
                        pb: 0.5,
                        backgroundColor: "#ffffff",
                    }}
                >
                    {images.map((image, index) => (
                        <Box key={`${image.name}-${index}`} sx={{ position: "relative" }}>
                            <Box
                                component="img"
                                src={image.dataUrl}
                                alt={image.name}
                                title={image.name}
                                sx={{
                                    width: 72,
                                    height: 72,
                                    objectFit: "cover",
                                    borderRadius: 1,
                                    border: "1px solid #e6e6e3",
                                    display: "block",
                                }}
                            />
                            <IconButton
                                size="small"
                                aria-label="첨부 제거"
                                onClick={() => setImages((prev) => prev.filter((_item, i) => i !== index))}
                                sx={{
                                    position: "absolute",
                                    top: -6,
                                    right: -6,
                                    p: 0.25,
                                    bgcolor: "#ffffff",
                                    border: "1px solid #e6e6e3",
                                    "&:hover": { bgcolor: "#f1f5f9" },
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}
            {/* flex 컨테이너 — 버튼 세로중앙 정확도를 위해 (게시판 댓글 입력칸과 동일)
                파일을 입력칸 위로 끌어오면 드롭존이 덮이고, 놓으면 첨부 대기 목록에 들어간다. */}
            <Box
                sx={{ position: "relative", display: "flex", width: "100%" }}
                onDragOver={(event) => {
                    // 파일 끌어오기만 받는다(글자 선택 드래그는 무시).
                    if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return;
                    event.preventDefault();
                    setDropOver(true);
                }}
                onDragLeave={(event) => {
                    // 내부 자식으로 옮겨가는 중이면 유지한다(깜빡임 방지).
                    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                    setDropOver(false);
                }}
                onDrop={(event) => {
                    if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return;
                    event.preventDefault();
                    setDropOver(false);
                    handlePickImages(event.dataTransfer?.files ?? null);
                }}
            >
                {/* 드롭존 오버레이 — 끌어온 동안에만 덮는다(포인터는 통과시켜 drop 이 컨테이너로 온다). */}
                {dropOver ? (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.75,
                            borderRadius: 1,
                            border: "2px dashed #2f80ed",
                            bgcolor: "rgba(47,128,237,0.08)",
                            color: "#2f80ed",
                            fontSize: 14,
                            fontWeight: 600,
                            pointerEvents: "none",
                        }}
                    >
                        <ImageOutlinedIcon sx={{ fontSize: 18 }} />
                        여기에 놓으면 이미지가 첨부됩니다
                    </Box>
                ) : null}
                <TextField
                    multiline
                    minRows={3}
                    maxRows={10}
                    fullWidth
                    inputRef={textFieldRef}
                    placeholder="궁금한 내용을 입력하세요"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                        // Enter 전송, Shift+Enter 개행.
                        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                            event.preventDefault();
                            handleSubmit();
                        }
                    }}
                    onPaste={(event) => {
                        // 클립보드에 이미지가 있으면 첨부하고, 텍스트 붙여넣기는 기본 동작에 맡긴다.
                        const pastedFiles = Array.from(event.clipboardData?.files ?? []).filter((file) =>
                            file.type.startsWith("image/")
                        );
                        if (pastedFiles.length === 0) return;
                        event.preventDefault();
                        handlePickImageFiles(pastedFiles);
                    }}
                    disabled={sending}
                    sx={{
                        "& .MuiInputBase-root": {
                            pl: 2,
                            pr: 6.5,
                            pb: 5,
                            borderRadius: 0,
                            backgroundColor: "#ffffff",
                            fontSize: "1rem",
                        },
                        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    }}
                />
                {/* 이미지 첨부 — 왼쪽 아래 */}
                <Box sx={{ position: "absolute", left: 8, bottom: 6, display: "flex", alignItems: "center" }}>
                    <IconButton
                        size="small"
                        aria-label="이미지 첨부"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={sending || images.length >= MAX_ATTACH_IMAGE_COUNT}
                        sx={{ color: "#9a9a97" }}
                    >
                        <ImageOutlinedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </Box>
                {/* 보내기 — 오른쪽 세로중앙 */}
                <IconButton
                    aria-label="보내기"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    sx={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#2563eb",
                        "&.Mui-disabled": { color: "#c9c8c5" },
                    }}
                >
                    <SendIcon sx={{ fontSize: 22 }} />
                </IconButton>
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(event) => {
                        handlePickImages(event.target.files);
                        event.target.value = "";
                    }}
                />
            </Box>
        </Box>
    );
}

import { useState } from "react";
import { Box, Button, Collapse, IconButton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { ReplaceCandidate } from "../../types";

/** 정정 후보 목록 props */
interface ReplaceCandidateListProps {
    candidates: ReplaceCandidate[]; // 고칠 수 있는 기존 지식 후보
    draftSeq: number; // 새로 정리한 초안 지식 seq(선택 시 이 내용으로 덮어쓴다)
    disabled: boolean; // 전송 중이면 비활성
    onPick: (value: string) => void; // 선택지 전송(#kb:replace:draft:target)
}

/**
 * 교육자 정정 시 "어느 기존 지식을 고칠지" 고르는 목록이다.
 * 제목만 먼저 보여주고 > 아이콘으로 본문을 펼쳐 확인한 뒤 하나를 택해 수정한다.
 * (자동으로 덮어쓰지 않는다 — 비슷하지만 다른 주제를 덮으면 멀쩡한 지식이 사라진다)
 */
export function ReplaceCandidateList({ candidates, draftSeq, disabled, onPick }: ReplaceCandidateListProps) {
    // 펼쳐서 본문을 보고 있는 후보 seq (null 이면 모두 접힘)
    const [openSeq, setOpenSeq] = useState<number | null>(null);

    if (candidates.length === 0) return null;
    return (
        <Box
            sx={{
                mt: 1,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                maxWidth: "92%",
                alignSelf: "flex-start",
            }}
        >
            {candidates.map((candidate) => {
                const open = openSeq === candidate.seq;
                return (
                    <Box
                        key={candidate.seq}
                        sx={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "10px",
                            bgcolor: "#ffffff",
                            overflow: "hidden",
                        }}
                    >
                        {/* 제목 줄 — 오른쪽 > 아이콘으로 본문을 펼친다. */}
                        <Box
                            onClick={() => setOpenSeq(open ? null : candidate.seq)}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 1.5,
                                py: 1,
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#f8fafc" },
                            }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box
                                    sx={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#111",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {candidate.title}
                                </Box>
                                <Box sx={{ fontSize: "12px", color: "#6b7280", mt: 0.25 }}>
                                    유사도 {Math.round(candidate.score * 100)}%
                                </Box>
                            </Box>
                            <IconButton size="small" sx={{ color: "#6b7280" }} aria-label={open ? "접기" : "내용 보기"}>
                                {open ? (
                                    <ExpandMoreIcon sx={{ fontSize: 20 }} />
                                ) : (
                                    <ChevronRightIcon sx={{ fontSize: 20 }} />
                                )}
                            </IconButton>
                        </Box>

                        {/* 본문 + 이 지식을 고르는 버튼 */}
                        <Collapse in={open} unmountOnExit>
                            <Box sx={{ px: 1.5, pb: 1.25, borderTop: "1px solid #f1f5f9" }}>
                                <Box
                                    sx={{
                                        fontSize: "13.5px",
                                        color: "#374151",
                                        lineHeight: 1.6,
                                        whiteSpace: "pre-wrap",
                                        pt: 1,
                                        // 본문이 길 수 있어 대화창을 덮지 않게 높이를 제한한다.
                                        maxHeight: 220,
                                        overflowY: "auto",
                                    }}
                                >
                                    {candidate.content}
                                </Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={disabled}
                                    onClick={() => onPick(`#kb:replace:${draftSeq}:${candidate.seq}`)}
                                    sx={{ mt: 1 }}
                                >
                                    이 지식을 수정
                                </Button>
                            </Box>
                        </Collapse>
                    </Box>
                );
            })}
        </Box>
    );
}

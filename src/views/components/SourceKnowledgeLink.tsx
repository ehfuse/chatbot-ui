import { Box } from "@mui/material";
import { openKnowledgeDialogBySeq } from "../../utils/knowledgeDialogHost";

/** 근거 표시 props */
interface SourceKnowledgeLinkProps {
    knowledgeSeq?: number | null; // 답변 근거로 쓰인 학습 지식 seq
    faqSeq?: number | null; // 답변 근거로 쓰인 FAQ seq
}

/**
 * 답변 말풍선 아래에 붙는 "사용된 지식" 링크다 (교육자에게만 보인다).
 *
 * 엉뚱한 지식이 근거로 잡혀 답이 어긋나는 일이 있어, 어떤 지식을 보고 답했는지 바로 확인하고
 * 고칠 수 있게 한다. 헤더에 상주하는 전역 호스트가 지식 편집 창을 현재 탭에 띄우므로
 * 상담을 이어가면서 그 자리에서 고칠 수 있다. 호스트가 없는 화면(상담 팝업 창 등)에서만
 * 관리 화면 딥링크를 새 탭으로 여는 예전 방식으로 물러선다.
 */
export function SourceKnowledgeLink({ knowledgeSeq, faqSeq }: SourceKnowledgeLinkProps) {
    const seq = Number(knowledgeSeq) || 0;
    const faq = Number(faqSeq) || 0;
    if (!seq && !faq) return null;

    /** 현재 탭에서 지식 편집 창을 연다. 호스트가 없으면 새 탭 딥링크로 물러선다. */
    const handleOpen = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!openKnowledgeDialogBySeq(seq)) return;
        event.preventDefault();
    };

    // 글자 아래 여백은 말풍선 패딩(py: 1.5 = 12px)이 만들므로, 위쪽 두 간격도 12px 로 맞춘다.
    // 본문 →mt→ 구분선 →pt→ "사용된 지식" →말풍선 패딩→ 끝 이 모두 같은 값이어야 균등해 보인다.
    return (
        <Box
            sx={{
                mt: 1.5,
                pt: 1.5,
                borderTop: "1px solid rgba(15, 23, 42, 0.08)",
                fontSize: "13.5px",
                color: "#4b5765",
            }}
        >
            사용된 지식:{" "}
            {seq ? (
                <Box
                    component="a"
                    href={`/dashboard/chatbot/manage?knowledge=${seq}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleOpen}
                    sx={{ color: "#2563eb", fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                    #{seq}
                </Box>
            ) : (
                `FAQ #${faq}`
            )}
        </Box>
    );
}

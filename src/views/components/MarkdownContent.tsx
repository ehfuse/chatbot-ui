/**
 * 챗봇 답변 본문 렌더러 — 답변은 마크다운으로 온다(AS chat.ts: "답변 본문 (마크다운 가능)").
 * 말풍선과 스트리밍 미리보기가 같은 모양이 되도록 이 컴포넌트를 공용으로 쓴다.
 *
 * 말풍선은 whiteSpace: pre-wrap 이라 문단마다 <p> 기본 여백까지 더해지면 줄간격이 벌어진다.
 * → 블록 요소 여백을 직접 정하고, 마지막 블록의 아래 여백은 없애 말풍선 아래가 뜨지 않게 한다.
 */

import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
    /** 마크다운 원문 */
    text: string;
}

/** 챗봇 답변 마크다운을 말풍선 안에서 읽기 좋게 렌더링한다. */
export function MarkdownContent({ text }: MarkdownContentProps) {
    return (
        <Box
            sx={{
                // 마크다운이 줄바꿈을 <p>·<li> 로 만들어 주므로 pre-wrap 을 끈다.
                // (그대로 두면 문단 사이 빈 줄이 이중으로 들어가 답변이 성기게 보인다)
                whiteSpace: "normal",
                "& > *:first-of-type": { mt: 0 },
                "& > *:last-child": { mb: 0 },
                "& p": { m: 0, mb: 1 },
                // 목록은 불릿이 말풍선 밖으로 나가지 않게 안쪽 여백만 준다.
                "& ul, & ol": { my: 1, pl: 2.5 },
                "& li": { mb: 0.25 },
                "& li > p": { m: 0 },
                "& h1, & h2, & h3, & h4, & h5, & h6": {
                    m: 0,
                    mt: 1.5,
                    mb: 0.75,
                    fontSize: "1rem",
                    fontWeight: 700,
                    lineHeight: 1.4,
                },
                "& strong": { fontWeight: 700 },
                "& code": {
                    px: 0.5,
                    py: 0.125,
                    borderRadius: "4px",
                    backgroundColor: "rgba(15, 23, 42, 0.06)",
                    fontFamily: "monospace",
                    fontSize: "0.9em",
                    wordBreak: "break-word",
                },
                "& pre": {
                    my: 1,
                    p: 1.25,
                    borderRadius: "8px",
                    backgroundColor: "rgba(15, 23, 42, 0.06)",
                    // 긴 코드가 말풍선을 벌리지 않게 블록 안에서만 가로 스크롤한다.
                    overflowX: "auto",
                },
                "& pre code": { p: 0, backgroundColor: "transparent" },
                "& a": { color: "#2563eb", wordBreak: "break-word" },
                "& blockquote": {
                    my: 1,
                    ml: 0,
                    pl: 1.25,
                    borderLeft: "3px solid rgba(15, 23, 42, 0.15)",
                    color: "#475569",
                },
                "& hr": { my: 1.5, border: 0, borderTop: "1px solid rgba(15, 23, 42, 0.12)" },
                // 표도 말풍선을 밀어내지 않게 감싼 박스 안에서 가로 스크롤한다.
                "& .markdown-table-wrap": { my: 1, overflowX: "auto" },
                "& table": { borderCollapse: "collapse", width: "100%" },
                "& th, & td": {
                    border: "1px solid rgba(15, 23, 42, 0.15)",
                    px: 1,
                    py: 0.5,
                    textAlign: "left",
                    whiteSpace: "nowrap",
                },
            }}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // 링크는 새 탭으로 (대시보드 SPA 화면을 벗어나지 않게).
                    a: ({ children, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                    // 표는 스크롤 래퍼로 감싼다.
                    table: ({ children, ...props }) => (
                        <div className="markdown-table-wrap">
                            <table {...props}>{children}</table>
                        </div>
                    ),
                }}
            >
                {text}
            </ReactMarkdown>
        </Box>
    );
}

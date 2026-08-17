/** 목록 검색어 강조 표시다 (패키지 내부 전용 — 대소문자 무시, 모든 일치 구간 강조). */

import { Fragment } from "react";

/** 검색 강조 props 다. */
export interface HighlightTextProps {
    text?: string | null; // 표시할 원문
    keyword?: string; // 검색어(빈 값이면 원문 그대로)
    fallback?: string; // 원문이 비었을 때 대체 텍스트
}

/** 정규식 특수문자를 이스케이프한다(검색어를 패턴이 아니라 글자로 다룬다). */
function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 검색어와 일치하는 구간을 굵게 강조해 표시한다. */
export function HighlightText({ text, keyword, fallback = "-" }: HighlightTextProps) {
    const source = String(text ?? "");
    if (!source) return <>{fallback}</>;

    const query = String(keyword ?? "").trim();
    if (!query) return <>{source}</>;

    const parts = source.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <Fragment key={index}>
                        <span style={{ fontWeight: 600, color: "#2563eb" }}>{part}</span>
                    </Fragment>
                ) : (
                    <Fragment key={index}>{part}</Fragment>
                )
            )}
        </>
    );
}

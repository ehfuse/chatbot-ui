import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@mui/material";
import { OverlayScrollbar } from "@ehfuse/overlay-scrollbar";
import type { OverlayScrollbarRef } from "@ehfuse/overlay-scrollbar";

/** 관리 탭 본문 스크롤 래퍼 props */
interface ManageTabScrollProps {
    toolbar?: ReactNode; // 상단 고정 영역 (필터/검색 행) — 없으면 본문만 렌더한다
    children: ReactNode; // 스크롤되는 본문 (표·카드 등)
}

/**
 * 관리 탭 본문을 세로 스크롤 가능하게 감싼다.
 *
 * 탭 패널(ManagePage)은 `flex:1 minHeight:0` 인 flex 컬럼이라, 탭이 자기 높이를 잡지 않으면
 * 내용이 패널 높이로 눌려 표 아래쪽이 잘린 채 스크롤도 되지 않는다. 필터 행은 고정하고
 * 그 아래만 스크롤해야 필터를 찾으러 위로 올라갈 필요가 없다.
 */
export function ManageTabScroll({ toolbar, children }: ManageTabScrollProps) {
    const scrollbarRef = useRef<OverlayScrollbarRef | null>(null);
    const [contentEl, setContentEl] = useState<HTMLElement | null>(null);
    // 세로 스크롤이 있으면 마지막 행이 표 하단 테두리에 닿으므로 하단선을 생략하고, 없으면 그린다.
    // (업무함 TaskBoxTable·지식 목록과 동일한 판정 방식)
    const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
    useEffect(() => {
        const container = scrollbarRef.current?.getScrollContainer();
        if (!container || !contentEl) return;
        const measure = () => setHasVerticalScroll(container.scrollHeight > container.clientHeight);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(container);
        // 행 증감으로 콘텐츠 높이가 바뀌는 것도 감지해야 한다(컨테이너 크기는 그대로다).
        observer.observe(contentEl);
        return () => observer.disconnect();
    }, [contentEl]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {toolbar ? <Box sx={{ flexShrink: 0 }}>{toolbar}</Box> : null}
            <OverlayScrollbar
                ref={scrollbarRef}
                style={{ flex: 1, minHeight: 0 }}
                // 표가 nowrap 셀로 max-content 까지 벌어져 가로로 밀려나지 않게 한다(안쪽 overflowX 가 담당).
                contentStyle={{ minWidth: 0 }}
                track={{ alignment: "outside" }}
                thumb={{ width: 10 }}
            >
                {/* 스크롤 콘텐츠는 flex 아이템이라 flexShrink:0 이 없으면 넘칠 때 늘지 않고 눌린다. */}
                <Box
                    ref={setContentEl}
                    sx={{
                        flexShrink: 0,
                        minWidth: 0,
                        // 스크롤이 있을 때만 마지막 행 하단선을 끈다(없으면 표가 닫히지 않은 것처럼 보인다).
                        ...(hasVerticalScroll ? { "& tbody tr:last-child td": { borderBottom: "none" } } : {}),
                    }}
                >
                    {children}
                </Box>
            </OverlayScrollbar>
        </Box>
    );
}

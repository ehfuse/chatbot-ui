import { Box, Typography } from "@mui/material";

/** 통계 카드 색상 조합 타입이다. */
export interface StatTone {
    bg: string; // 배경색
    fg: string; // 값 글자색
}

/** 통계 카드 props 타입이다. */
interface ManageStatCardProps {
    label: string; // 지표 이름
    value: string; // 지표 값(숫자·금액 등 이미 포맷된 문자열)
    tone: StatTone; // 배경/글자 색 조합
    hint?: string; // 라벨 오른쪽 보조 설명(선택) — 예: "사용자 12명"
}

/**
 * 관리 화면 요약 카드 1장 — 테두리 없이 배경색으로 구분한다.
 *
 * 분석·사용현황이 같은 컴포넌트를 쓴다(각자 복사본을 두면 나란히 놓였을 때 모양이 갈린다).
 * 값은 오른쪽 정렬한다 — 자릿수가 다른 숫자를 세로로 훑을 때 끝자리가 맞아야 크기 비교가 된다.
 * 보조 설명은 값 아래가 아니라 라벨 줄 오른쪽에 둔다(값 아래에 두면 큰 숫자와 경쟁해 읽기 어렵다).
 */
export function ManageStatCard({ label, value, tone, hint }: ManageStatCardProps) {
    return (
        <Box sx={{ borderRadius: 2, p: 2, display: "flex", flexDirection: "column", gap: 0.5, bgcolor: tone.bg }}>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
                <Typography sx={{ fontSize: "13.5px", color: "#374151", fontWeight: 600 }}>{label}</Typography>
                {hint ? (
                    <Typography sx={{ fontSize: "12.5px", color: "#4b5563", whiteSpace: "nowrap" }}>{hint}</Typography>
                ) : null}
            </Box>
            <Typography sx={{ fontSize: "22px", color: tone.fg, fontWeight: 700, textAlign: "right" }}>
                {value}
            </Typography>
        </Box>
    );
}

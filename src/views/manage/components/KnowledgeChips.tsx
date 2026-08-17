/**
 * KnowledgeChips.tsx
 *
 * 챗봇 관리 화면 공용 칩 컴포넌트 모음.
 * 지식 스코프/상태/후보 사유/피드백 평가를 색상 칩으로 표시한다.
 */
import { Box, Chip, Rating, Tooltip } from "@mui/material";
import { StarRoundedIcon } from "../../../internal/icons";
import type { KnowledgeStatus } from "../../../types/manage";

/** 칩 공통 스타일을 생성한다. (13.5px 이상 진한 글자 + 모서리 4px 사각형)
 *  관리 화면의 칩은 모두 같은 모양을 쓴다 — 일부만 둥근 알약이면 표에서 튀어 보인다. */
function chipSx(bgcolor: string, color: string) {
    return { bgcolor, color, fontSize: "13.5px", fontWeight: 600, borderRadius: "4px" };
}

/** 지식 스코프 칩 — 공용(파랑) / 가맹점명(회색) 을 표시한다.
 *  가맹점명은 서버가 붙여 주며, 아직 못 읽었을 때만 seq 로 대체 표시한다. */
export function ScopeChip({
    targetLicenseSeq,
    targetLicenseName,
}: {
    targetLicenseSeq: number | null;
    targetLicenseName?: string;
}) {
    if (targetLicenseSeq == null) {
        return <Chip label="공용" size="small" sx={chipSx("#dbeafe", "#1e40af")} />;
    }
    const label = targetLicenseName?.trim() || `가맹점 ${targetLicenseSeq}`;
    return <Chip label={label} size="small" sx={chipSx("#e5e7eb", "#374151")} />;
}

/** 지식 상태별 칩 라벨/색상 정의다. */
const STATUS_CHIP_MAP: Record<KnowledgeStatus, { label: string; bg: string; fg: string }> = {
    verified: { label: "승인", bg: "#dcfce7", fg: "#166534" },
    unverified: { label: "미검증", bg: "#ffedd5", fg: "#9a3412" },
    rejected: { label: "폐기", bg: "#e5e7eb", fg: "#374151" },
    candidate: { label: "후보", bg: "#e0e7ff", fg: "#3730a3" },
};

/** 지식 상태 칩 — verified(초록)/unverified(주황)/rejected(회색)/candidate(남색) 을 표시한다. */
export function StatusChip({ status }: { status: KnowledgeStatus }) {
    const config = STATUS_CHIP_MAP[status] ?? { label: String(status), bg: "#e5e7eb", fg: "#374151" };
    return <Chip label={config.label} size="small" sx={chipSx(config.bg, config.fg)} />;
}

/** 지식 후보 사유 칩 — unanswered="답 못한 질문", user_taught="사용자 제보", escalated="고객센터 이관" 을 표시한다. */
export function ReasonChip({ reason }: { reason: string | null }) {
    if (reason === "unanswered") {
        return <Chip label="답 못한 질문" size="small" sx={chipSx("#ffedd5", "#9a3412")} />;
    }
    if (reason === "user_taught") {
        return <Chip label="사용자 제보" size="small" sx={chipSx("#dbeafe", "#1e40af")} />;
    }
    if (reason === "escalated") {
        return <Chip label="고객센터 이관" size="small" sx={chipSx("#ede9fe", "#5b21b6")} />;
    }
    return <Chip label={reason || "기타"} size="small" sx={chipSx("#e5e7eb", "#374151")} />;
}

/** 배경 없는 칩 스타일 — 글자색만으로 구분한다(표에서 색 덩어리가 반복되면 시선이 분산된다). */
function plainChipSx(color: string) {
    return { bgcolor: "transparent", color, fontSize: "13.5px", fontWeight: 600, px: 0 };
}

/** 답변 피드백 평가 칩 — good(초록)/bad(빨강) 을 글자색으로만 구분한다. */
export function RatingChip({ rating }: { rating: "good" | "bad" }) {
    if (rating === "good") {
        return <Chip label="👍 좋아요" size="small" sx={plainChipSx("#166534")} />;
    }
    return <Chip label="👎 아쉬워요" size="small" sx={plainChipSx("#991b1b")} />;
}

/** 중복 의심 배지 칩이다. (중복 검사 결과 표시) */
export function DuplicateBadge() {
    return <Chip label="중복 의심" size="small" sx={chipSx("#fef9c3", "#854d0e")} />;
}

/** 좋아요/싫어요 수를 5점 만점 별점으로 환산한다. 평가가 없으면 0점(빈 별 5개). */
function toSatisfactionScore(goodCount: number, badCount: number): number {
    const total = goodCount + badCount;
    if (total <= 0) return 0;
    // 만족도 비율(0~1)을 5점으로 환산하고 0.5 단위로 반올림한다(Rating precision 과 동일 단위).
    return Math.round((goodCount / total) * 5 * 2) / 2;
}

/** 지식 만족도 별점 — 👍/👎 누적수를 5점 만점 별점으로 보여준다(평가 없으면 빈 별 5개). */
export function SatisfactionRating({ goodCount, badCount }: { goodCount: number; badCount: number }) {
    const score = toSatisfactionScore(goodCount, badCount);
    const total = goodCount + badCount;
    return (
        <Tooltip title={total > 0 ? `👍 ${goodCount} / 👎 ${badCount} (평가 ${total}건)` : "평가 없음"} arrow>
            {/* 별점은 표시 전용이다 — 관리자가 여기서 점수를 매기는 값이 아니라 사용자 평가의 집계다. */}
            <Box sx={{ display: "inline-flex", alignItems: "center" }}>
                <Rating
                    value={score}
                    precision={0.5}
                    size="small"
                    readOnly
                    // ⚠️ Rating 의 fontSize 는 "기본 별"에만 먹는다 — 커스텀 icon 을 넘기면
                    // 그 SvgIcon 자신의 fontSize(기본 24px)가 이겨서 크기가 안 줄어든다.
                    // 그래서 아이콘 쪽에 직접 크기를 준다(간격도 함께 좁힌다).
                    sx={{ gap: "1px" }}
                    // 채운 별은 안쪽까지 칠하고, 빈 별은 윤곽선만 남겨 5개 자리를 항상 보여준다.
                    icon={<StarRoundedIcon sx={{ fontSize: 18, fill: "currentColor" }} />}
                    emptyIcon={<StarRoundedIcon sx={{ fontSize: 18, color: "#c7c7c4" }} />}
                />
            </Box>
        </Tooltip>
    );
}

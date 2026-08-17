/**
 * KnowledgeTab.tsx
 *
 * 챗봇 관리 > 지식 탭.
 * 지식 목록(스코프/상태/분류/제목/평가/검증일)과 상태 필터·오래된 지식 토글·검색·중복 검사를 제공한다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { SearchTextField, Switch } from "@ehfuse/mui-form-controls";
import { useChatbotSelectOptions } from "../../../ChatbotProvider";
import { chatbotManageApi } from "../../../apis/manageApi";
import { KnowledgeList } from "../components/KnowledgeList";
import type { useChatbotManageController } from "../../../controllers/manageController";
import type { DuplicateGroup, KnowledgeFilters, KnowledgeRow, KnowledgeSort } from "../../../types/manage";
import { ManageFilterSwitch } from "../components/ManageFilterSwitch";
import { manageFilterRowSx } from "../components/manageTableStyles";

/** 지식 탭 props 타입이다. */
interface KnowledgeTabProps {
    controller: ReturnType<typeof useChatbotManageController>; // 챗봇 관리 컨트롤러
    isHeadOffice: boolean; // 본사 여부 — 스코프 컬럼/필터는 본사에서만 의미가 있다
}

/** 지식 상태 필터 옵션이다. ("all" 은 전체 조회 센티널) */
const STATUS_OPTIONS = [
    { value: "all", label: "전체" },
    { value: "verified", label: "승인" },
    { value: "unverified", label: "미검증" },
    { value: "rejected", label: "폐기" },
];

/** 챗봇 관리 지식 탭 컴포넌트다. */
export function KnowledgeTab({ controller, isHeadOffice }: KnowledgeTabProps) {
    const { state, openKnowledgeDialog, openKnowledgeCreate } = controller;
    const itemsRaw = state.useValue("knowledgeItems") as KnowledgeRow[] | undefined;
    const items = itemsRaw || [];
    const filtersRaw = state.useValue("knowledgeFilters") as KnowledgeFilters | undefined;
    const filters = filtersRaw || {
        status: "",
        category: "",
        scope: "",
        stale: false,
        search: "",
        sort: "updated_time" as const,
        sortDir: "DESC" as const,
    };
    // 분류 선택지 — 지식 등록 시 누적되는 select_options(chatbot_knowledge_category)를 그대로 쓴다.
    const { values: categoryValues } = useChatbotSelectOptions("chatbot_knowledge_category");

    // 스코프 선택지 — "공용" + 장례식장 가맹점 목록(본사 조회에서만 의미가 있다).
    const [scopeLicenses, setScopeLicenses] = useState<Array<{ seq: number; name: string }>>([]);
    useEffect(() => {
        if (!isHeadOffice) return;
        let alive = true;
        void chatbotManageApi
            .listScopeLicenses()
            .then((response) => {
                if (alive && response.ok && Array.isArray(response.items)) setScopeLicenses(response.items);
            })
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, [isHeadOffice]);
    const scopeOptions = useMemo(
        () => [
            { value: "shared", label: "공용" },
            ...scopeLicenses.map((license) => ({ value: String(license.seq), label: license.name })),
        ],
        [scopeLicenses]
    );

    /** 스코프 필터 변경 시 목록을 첫 페이지부터 재조회한다. */
    const handleScopeChange = (scope: string) => {
        state.actions.setKnowledgeFilters({ scope });
        state.actions.loadKnowledge();
    };
    const duplicateChecking = state.useValue("duplicateChecking") === true;
    const duplicateOnly = state.useValue("duplicateOnly") === true;
    const duplicateGroupsRaw = state.useValue("duplicateGroups") as DuplicateGroup[] | undefined;
    const duplicateGroups = duplicateGroupsRaw || [];
    const loadingMoreRaw = state.useValue("knowledgeLoadingMore") as boolean | undefined;
    const loadingMore = loadingMoreRaw === true;
    const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 언마운트 시 검색 디바운스 타이머를 정리한다.
    useEffect(() => {
        return () => {
            if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
        };
    }, []);

    // 상태 "전체" 의 후보 제외는 서버가 처리한다(exclude_candidate) — 여기서 자르면 페이지가 50건보다 적어진다.
    const visibleItems = items;

    /** 상태 필터 변경 시 목록을 재조회한다. */
    const handleStatusChange = useCallback(
        (value: string) => {
            state.actions.setKnowledgeFilters({ status: value === "all" ? "" : value });
            state.actions.loadKnowledge();
        },
        [state.actions]
    );

    /** 오래된 지식 토글 변경 시 목록을 재조회한다. */
    const handleStaleChange = useCallback(
        (checked: boolean) => {
            state.actions.setKnowledgeFilters({ stale: checked });
            state.actions.loadKnowledge();
        },
        [state.actions]
    );

    /** 정렬 기준을 바꾼다. 같은 컬럼을 다시 누르면 방향만 뒤집는다. (정렬은 서버가 전체 기준으로 처리) */
    const handleSortChange = useCallback(
        (nextSort: KnowledgeSort) => {
            const current = state.getValue("knowledgeFilters") as KnowledgeFilters;
            const sameColumn = current.sort === nextSort;
            state.actions.setKnowledgeFilters({
                sort: nextSort,
                // 새 컬럼은 큰 값부터(만족도 높은 순·최신순) 보는 게 자연스럽다.
                sortDir: sameColumn && current.sortDir === "DESC" ? "ASC" : "DESC",
            });
            state.actions.loadKnowledge();
        },
        [state]
    );

    /** 분류 필터 변경 시 목록을 첫 페이지부터 재조회한다. */
    const handleCategoryChange = useCallback(
        (category: string) => {
            state.actions.setKnowledgeFilters({ category });
            state.actions.loadKnowledge();
        },
        [state.actions]
    );

    /** 검색어 입력을 디바운스해 목록을 재조회한다. */
    const handleSearchChange = useCallback(
        (keyword: string) => {
            state.actions.setKnowledgeFilters({ search: keyword });
            if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
            searchDebounceTimerRef.current = setTimeout(() => {
                state.actions.loadKnowledge();
            }, 300);
        },
        [state.actions]
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* 필터 영역 — 왼쪽: 지식등록 + 검색 + 중복검사 / 오른쪽: 오래된 지식 스위치 + 상태 버튼 */}
            <Box sx={{ ...manageFilterRowSx, flexShrink: 0 }}>
                {/* 대화를 거치지 않고 교육자가 지식을 직접 쓰는 자리다. 목록 맨 앞에 둬서 바로 눈에 띄게 한다. */}
                <Button
                    size="small"
                    variant="contained"
                    disableElevation
                    startIcon={<AddIcon />}
                    onClick={() => openKnowledgeCreate()}
                    sx={{ flexShrink: 0, fontSize: "13.5px", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                    지식등록
                </Button>
                <SearchTextField
                    size="small"
                    placeholder="검색어를 입력하세요"
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    sx={{ width: 260 }}
                />
                {/* 중복의심 — 켜면 서로 비슷한 지식만 그룹으로 묶어 보여준다(짝을 찾아 헤매지 않게). */}
                <Box sx={{ "& .MuiFormControlLabel-label": { fontSize: "13px" } }}>
                    <Switch
                        label={duplicateChecking ? "검사 중…" : "중복의심"}
                        size="small"
                        checked={duplicateOnly}
                        disabled={duplicateChecking}
                        onChange={(_e, checked) => state.actions.toggleDuplicateOnly(checked)}
                    />
                </Box>
                {/* 오래된 지식 토글 — 왼쪽 그룹, 라벨 폰트 축소(FormControlLabel 라벨을 래퍼로 제어) */}
                <Box sx={{ "& .MuiFormControlLabel-label": { fontSize: "13px" } }}>
                    <Switch
                        label="오래된 지식"
                        size="small"
                        checked={filters.stale}
                        onChange={(_e, checked) => handleStaleChange(checked)}
                    />
                </Box>
                <Box sx={{ flex: 1 }} />
                {/* 상태 필터 — 업무함 보기 스위처처럼 텍스트 버튼 나열(선택만 강조) */}
                <ManageFilterSwitch
                    options={STATUS_OPTIONS}
                    value={filters.status || "all"}
                    onChange={handleStatusChange}
                />
            </Box>

            {/* 지식 목록 — 업무함 목록 보기와 동일한 그리드 목록(가상화 + 무한스크롤) */}
            <KnowledgeList
                items={visibleItems}
                searchText={filters.search}
                duplicateGroups={duplicateOnly ? duplicateGroups : undefined}
                sort={filters.sort}
                sortDir={filters.sortDir}
                onSortChange={handleSortChange}
                categoryValue={filters.category}
                categoryOptions={categoryValues}
                onCategoryChange={handleCategoryChange}
                scopeValue={filters.scope}
                scopeOptions={scopeOptions}
                onScopeChange={handleScopeChange}
                showScope={isHeadOffice}
                onEndReached={() => state.actions.loadMoreKnowledge()}
                onRowClick={openKnowledgeDialog}
            />
            {loadingMore ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={20} />
                </Box>
            ) : null}
        </Box>
    );
}

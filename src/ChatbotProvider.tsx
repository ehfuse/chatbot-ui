/**
 * 횡단 관심사 주입 Provider 다 — 로그인 계정/권한·요청 헤더·이미지 뷰어·자동완성 옵션·FormDialog·라우팅.
 *
 * 챗봇 UI 자체는 앱의 로그인 스토어나 라우터를 몰라도 되도록, 앱에 매인 것들만 여기로 모아 주입받는다.
 * Provider 가 없어도 모든 컴포넌트가 기본값으로 동작한다(컨텍스트 기본값 = 빈 설정).
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { FormDialog as BaseFormDialog } from "@ehfuse/mui-form-dialog";
import { setChatbotRequestHeadersGetter } from "./internal/requestHeaders";
import type { ChatbotAccount, ChatbotConfig, ChatbotSelectOptions } from "./types/provider";

/** 설정 컨텍스트다(기본값 = 빈 설정 — 각 소비 지점이 폴백을 가진다). */
const ChatbotConfigContext = createContext<ChatbotConfig>({});

/** ChatbotProvider props 다. */
export interface ChatbotProviderProps {
    config?: ChatbotConfig; // 주입 설정(부분 지정 가능)
    children: ReactNode;
}

/** 챗봇 UI 설정을 주입한다. */
export function ChatbotProvider({ config, children }: ChatbotProviderProps) {
    const value = useMemo(() => config ?? {}, [config]);

    // API 함수는 컴포넌트 밖에서 호출되므로 헤더 공급자만 모듈 등록소로 넘긴다.
    useEffect(() => {
        setChatbotRequestHeadersGetter(value.getRequestHeaders ?? null);
        return () => setChatbotRequestHeadersGetter(null);
    }, [value.getRequestHeaders]);

    return <ChatbotConfigContext.Provider value={value}>{children}</ChatbotConfigContext.Provider>;
}

/** 현재 주입 설정을 읽는다(Provider 없으면 빈 설정). */
export function useChatbotConfig(): ChatbotConfig {
    return useContext(ChatbotConfigContext);
}

/** ES bool 필드 값(true/1/"1"/"true")을 boolean 으로 정규화한다. */
function toBoolean(value: unknown): boolean {
    return value === true || value === 1 || value === "1" || value === "true";
}

/** 로그인 계정을 읽는다(주입 안 됐으면 null). */
export function useChatbotAccount(): ChatbotAccount | null {
    return useChatbotConfig().account ?? null;
}

/**
 * 교육자 권한 여부다 — 명시 주입값이 우선, 없으면 계정의 is_trainer 또는 admin 역할로 판정한다.
 * (서버 requireTrainer 와 같은 조건 — 프런트만 교육자로 좁히면 admin 이 못 들어온다)
 */
export function useIsTrainer(): boolean {
    const { account, isTrainer } = useChatbotConfig();
    if (isTrainer !== undefined) return isTrainer;
    return toBoolean(account?.is_trainer) || account?.rbac_role === "admin";
}

/** 본사 로그인 여부다 — 가맹점 필터·공용 스코프처럼 본사에서만 의미 있는 UI 의 노출 기준이다. */
export function useIsHeadOffice(): boolean {
    const { account, isHeadOffice, headOfficeLicenseSeq } = useChatbotConfig();
    if (isHeadOffice !== undefined) return isHeadOffice;
    if (headOfficeLicenseSeq === undefined) return false;
    return Number(account?.license_seq) === headOfficeLicenseSeq;
}

/** 지식 분류 자동완성 옵션을 읽는다(주입 안 됐으면 빈 목록 — 자유 입력만 된다). */
export function useChatbotSelectOptions(optionType: string): ChatbotSelectOptions {
    const { useSelectOptions } = useChatbotConfig();
    // 훅 자리를 비우지 않기 위해 미주입 시에도 같은 위치에서 기본 구현을 호출한다.
    const hook = useSelectOptions ?? useEmptySelectOptions;
    return hook(optionType);
}

/** 자동완성 옵션 미주입 시 쓰는 빈 목록 훅이다. */
function useEmptySelectOptions(): ChatbotSelectOptions {
    return EMPTY_SELECT_OPTIONS;
}

/** 빈 옵션 목록 상수다(참조 고정 — 매 렌더 새 객체를 만들지 않는다). */
const EMPTY_SELECT_OPTIONS: ChatbotSelectOptions = { values: [] };

/** 다이얼로그 컴포넌트를 읽는다(앱 공통 FormDialog 주입 없으면 mfd 기본). */
export function useChatbotFormDialog() {
    return useChatbotConfig().FormDialogComponent ?? BaseFormDialog;
}

/** 앱 내 이동 함수를 읽는다(주입 안 됐으면 전체 새로고침 이동). */
export function useChatbotNavigate(): (path: string) => void {
    const { navigate } = useChatbotConfig();
    return useMemo(() => navigate ?? ((path: string) => window.location.assign(path)), [navigate]);
}

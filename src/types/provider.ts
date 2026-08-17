/** ChatbotProvider 주입 설정 타입이다. */

import type { ComponentType, ReactNode } from "react";
import type { AutocompleteOption } from "@ehfuse/mui-form-controls";

/** 챗봇이 필요로 하는 로그인 계정 정보다(소비처 계정 객체의 부분집합). */
export interface ChatbotAccount {
    seq?: number; // 계정 seq
    name?: string; // 표시 이름
    license_seq?: number; // 소속 라이선스(가맹점) seq
    is_trainer?: unknown; // 교육자 플래그(ES bool — true/1/"1"/"true")
    rbac_role?: string; // 권한 역할(admin 은 교육자와 동일 취급)
}

/** 자동완성 옵션 목록 훅의 반환값이다. */
export interface ChatbotSelectOptions {
    values: string[]; // 누적된 옵션 값(가나다순)
    renderOption?: (option: AutocompleteOption, query: string) => ReactNode; // 옵션 행 렌더러(삭제 X 버튼 등)
}

/**
 * 자동완성 옵션 목록을 돌려주는 훅이다.
 * ⚠️ 렌더마다 같은 자리에서 호출되므로 소비처는 참조가 안정적인 함수(모듈 스코프 훅)를 넘긴다.
 */
export type ChatbotSelectOptionsHook = (optionType: string) => ChatbotSelectOptions;

/** 챗봇 UI 횡단 주입 설정이다(모두 선택 — 없으면 각 지점이 기본값으로 동작한다). */
export interface ChatbotConfig {
    account?: ChatbotAccount | null; // 로그인 계정(소비처가 구독한 리액티브 값을 넘긴다)
    isTrainer?: boolean; // 교육자 여부(미지정 시 account.is_trainer 또는 rbac_role==="admin")
    isHeadOffice?: boolean; // 본사 여부(미지정 시 account.license_seq === headOfficeLicenseSeq)
    headOfficeLicenseSeq?: number; // 본사 라이선스 seq(가맹점 필터·공용 스코프 노출 기준)
    getRequestHeaders?: () => Record<string, string>; // 요청마다 덧붙일 헤더(realtime connection id 등)
    openImageViewer?: (src: string, index: number) => void; // 대화 첨부 이미지 확대(미지정 시 새 탭)
    useSelectOptions?: ChatbotSelectOptionsHook; // 지식 분류 자동완성 옵션 공급 훅
    onSelectOptionAdded?: (optionType: string, value: string) => void; // 새 옵션 값 저장 알림(자동완성 낙관적 반영용)
    FormDialogComponent?: ComponentType<any>; // 앱 공통 FormDialog(폰트 배율 등) — 미지정 시 mfd 기본
    navigate?: (path: string) => void; // 앱 내 이동(미지정 시 location.assign)
    chatPopupPath?: string; // 상담 팝업 창 경로(기본 "/chatbot")
    buildFileViewerUrl?: (uuid: string, name: string) => string; // 팝업 창에서 첨부를 여는 뷰어 주소
}

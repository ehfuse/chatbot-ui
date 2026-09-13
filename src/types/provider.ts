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

/**
 * 상담 창 브랜딩이다(첫 대화 전 빈 화면의 로고·인사말). 모두 선택 — 비우면 코드샵 기본값이다.
 * 패키지를 다른 서비스(업무함 등)가 그대로 쓰면서 코드샵 로고·문구가 박혀 보이는 문제로 추가했다(0.5.1).
 */
export interface ChatbotBrandConfig {
    name?: string; // 서비스 이름 — 인사말 "안녕하세요, {name} 상담 챗봇입니다" 에 들어간다(기본 "코드샵")
    logo?: ReactNode; // 로고 노드 — 있으면 logoSrc 대신 이것을 그린다(SVG 컴포넌트 로고용)
    logoSrc?: string; // 로고 이미지 주소(기본 "/codeshop/favicon.svg")
    logoAlt?: string; // 로고 이미지 alt(기본 name 또는 "codeshop")
    welcomeTitle?: string; // 인사말 전체를 바꿀 때(있으면 name 조합보다 우선)
    welcomeSubtitle?: ReactNode; // 인사말 아래 안내 문구(기본 "사용법 · 메뉴 위치 · … 무엇이든 물어보세요.")
    patternImage?: string; // 대화 배경 무늬 css url(...) 하나 — 비우면 코드샵 기본 꽃 무늬(타일 크기·엇갈림 배치는 기본과 같다)
}

/** 챗봇 UI 횡단 주입 설정이다(모두 선택 — 없으면 각 지점이 기본값으로 동작한다). */
export interface ChatbotConfig {
    brand?: ChatbotBrandConfig; // 상담 창 브랜딩(로고·인사말) — 비우면 코드샵 기본
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
    managePath?: string; // 챗봇 관리 페이지 경로(기본 "/dashboard/chatbot/manage") — 지식 링크 폴백에 쓴다
    buildSourcePostUrl?: (postSeq: number) => string; // 출처 문의글 주소(미지정 시 "문의글 열기" 버튼을 숨긴다)
    buildFileViewerUrl?: (uuid: string, name: string) => string; // 팝업 창에서 첨부를 여는 뷰어 주소
    /**
     * 상담 창 안에서 보여 줄 "내 문의" 목록 화면이다.
     * 문의 목록은 소비처(앱)의 고객센터 API·화면이라 패키지가 갖지 않는다 — 앱이 만든 화면을 그대로 받는다.
     * ⚠️ **이 값이 없으면 "내 문의" 아이콘 자체를 노출하지 않는다.** 목록을 보여 줄 계정에게만 넘기면 된다
     * (예: 문의를 받아서 답하는 본사 계정에는 넘기지 않는다 — 패키지는 그 판정을 하지 않는다).
     */
    renderMyInquiries?: () => ReactNode;
    myInquiryBadgeCount?: number; // "내 문의" 아이콘에 붙일 미확인 건수(0 이하면 배지를 숨긴다)
}

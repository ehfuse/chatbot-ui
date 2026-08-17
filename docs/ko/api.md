# API

## 목차

- [ChatbotProvider](#chatbotprovider)
  - [ChatbotConfig](#chatbotconfig)
  - [ChatbotAccount](#chatbotaccount)
  - [ChatbotSelectOptions](#chatbotselectoptions)
- [화면 컴포넌트](#화면-컴포넌트)
  - [ChatbotDrawer](#chatbotdrawer)
  - [ChatPanel](#chatpanel)
  - [ChatPopupPage](#chatpopuppage)
  - [ChatbotManagePage](#chatbotmanagepage)
  - [KnowledgeDialogHost](#knowledgedialoghost)
- [훅](#훅)
- [유틸](#유틸)

---

## ChatbotProvider

앱에 매인 값(로그인 계정·라우터·파일 뷰어·자동완성 옵션 원본)을 챗봇 UI 에 주입한다.

| prop | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `config` | [`ChatbotConfig`](#chatbotconfig) | `{}` | 주입 설정(부분 지정 가능) |
| `children` | `ReactNode` | — | 하위 트리 |

### ChatbotConfig

| 필드 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `account` | [`ChatbotAccount \| null`](#chatbotaccount) | `null` | 로그인 계정(구독한 리액티브 값을 넘긴다) |
| `isTrainer` | `boolean` | `account` 로 판정 | 교육자 여부 |
| `isHeadOffice` | `boolean` | `headOfficeLicenseSeq` 로 판정 | 본사 여부 |
| `headOfficeLicenseSeq` | `number` | — | 본사 라이선스 seq |
| `getRequestHeaders` | `() => Record<string, string>` | — | 요청마다 덧붙일 헤더(realtime connection id 등) |
| `openImageViewer` | `(src: string, index: number) => void` | 새 탭 열기 | 대화 첨부 이미지 확대 |
| `useSelectOptions` | [`ChatbotSelectOptionsHook`](#chatbotselectoptions) | 빈 목록 | 지식 분류 자동완성 옵션 공급 훅 |
| `onSelectOptionAdded` | `(optionType: string, value: string) => void` | — | 새 분류 저장 알림(자동완성 낙관적 반영) |
| `FormDialogComponent` | `ComponentType<any>` | mfd `FormDialog` | 앱 공통 다이얼로그 껍데기 |
| `navigate` | `(path: string) => void` | `location.assign` | 앱 내 이동 |
| `chatPopupPath` | `string` | `"/chatbot"` | 상담 팝업 창 경로 |
| `buildFileViewerUrl` | `(uuid: string, name: string) => string` | — | 팝업 창에서 첨부를 여는 뷰어 주소 |

> ⚠️ `useSelectOptions` 는 렌더마다 같은 자리에서 호출되므로 참조가 안정적인 함수(모듈 스코프 훅)를 넘긴다.
> `config` 객체 자체도 `useMemo` 로 고정한다.

### ChatbotAccount

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `seq` | `number` | 계정 seq |
| `name` | `string` | 표시 이름 |
| `license_seq` | `number` | 소속 라이선스(가맹점) seq |
| `is_trainer` | `unknown` | 교육자 플래그(`true`/`1`/`"1"`/`"true"`) |
| `rbac_role` | `string` | 권한 역할(`"admin"` 은 교육자와 동일 취급) |

### ChatbotSelectOptions

```ts
type ChatbotSelectOptionsHook = (optionType: string) => ChatbotSelectOptions;

interface ChatbotSelectOptions {
    values: string[]; // 누적된 옵션 값(가나다순)
    renderOption?: (option: AutocompleteOption, query: string) => ReactNode; // 옵션 행 렌더러
}
```

---

## 화면 컴포넌트

### ChatbotDrawer

오른쪽에서 열리는 상담 드로어다. props 없음. 열림 여부는 `chatbotState.isDrawerOpen` 이 소유한다.

### ChatPanel

드로어와 팝업 창이 공유하는 본문이다.

| prop | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `onClose` | `() => void` | — | 닫기 동작(없으면 닫기 버튼을 숨긴다) |
| `onOpenPopup` | `() => void` | — | 새 창으로 열기(없으면 버튼을 숨긴다) |

### ChatPopupPage

상담 대화창을 단독 페이지로 띄운다. props 없음.

### ChatbotManagePage

지식 / 지식 후보 / 답변 피드백 / 분석 / 사용현황 5탭 관리 화면이다.

| prop | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `initialKnowledgeSeq` | `number` | — | 진입 시 바로 열 지식 seq(딥링크) |
| `onInitialKnowledgeConsumed` | `() => void` | — | 딥링크를 소비한 뒤 호출(쿼리 정리용) |

### KnowledgeDialogHost

지식 편집 창의 전역 호스트다. props 없음. **앱 전체에 하나만** 마운트한다.

---

## 훅

| 훅 | 시그니처 | 설명 |
| --- | --- | --- |
| `useChatbotConfig` | `() => ChatbotConfig` | 주입 설정을 읽는다 |
| `useChatbotAccount` | `() => ChatbotAccount \| null` | 로그인 계정을 읽는다 |
| `useIsTrainer` | `() => boolean` | 교육자 권한 여부 |
| `useIsHeadOffice` | `() => boolean` | 본사 로그인 여부 |
| `useChatbotSelectOptions` | `(optionType: string) => ChatbotSelectOptions` | 자동완성 옵션 |
| `useChatbotFormDialog` | `() => ComponentType<any>` | 다이얼로그 껍데기 |
| `useChatbotNavigate` | `() => (path: string) => void` | 앱 내 이동 |
| `useChatbotController` | `() => { state }` | 상담 상태(`chatbotState`) |
| `useChatbotManageController` | `() => { state, form, modals, ... }` | 관리 상태(`chatbotManageState`) |
| `useChatRealtime` | `(handlers: ChatRealtimeHandlers) => void` | 스트리밍 수신 |
| `useChatImageViewer` | `() => (src: string, index: number) => void` | 첨부 확대 핸들러 |

---

## 유틸

| 함수 | 시그니처 | 설명 |
| --- | --- | --- |
| `openChatPopup` | `(path?: string) => boolean` | 상담 팝업 창을 연다(차단 시 `false`) |
| `registerKnowledgeDialogOpener` | `(fn: (seq: number) => void) => () => void` | 지식 창 열기 함수를 등록(반환값 호출로 해제) |
| `openKnowledgeDialogBySeq` | `(seq: number) => boolean` | 지식 창을 연다(호스트 없으면 `false`) |
| `chatbotManageApi` | 객체 | 지식/피드백/통계 관리 API 묶음 |

---

## 관련 문서

- [시작하기](./getting-started.md)
- [API](./api.md)
- [예제](./example.md)

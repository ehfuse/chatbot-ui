# API

## 목차

- [ChatbotProvider](#chatbotprovider)
  - [ChatbotConfig](#chatbotconfig)
  - [ChatbotAccount](#chatbotaccount)
  - [ChatbotSelectOptions](#chatbotselectoptions)
- [화면 컴포넌트](#화면-컴포넌트)
  - [ChatbotHostView](#chatbothostview)
  - [ChatbotDrawer](#chatbotdrawer)
  - [ChatPanel](#chatpanel)
  - [ChatPopupPage](#chatpopuppage)
  - [ChatbotManageRoutePage](#chatbotmanageroutepage)
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
| `managePath` | `string` | `"/dashboard/chatbot/manage"` | 관리 페이지 경로(지식 링크 폴백) |
| `buildSourcePostUrl` | `(postSeq: number) => string` | — | 출처 문의글 주소(미지정 시 "문의글 열기" 숨김) |
| `buildFileViewerUrl` | `(uuid: string, name: string) => string` | — | 팝업 창에서 첨부를 여는 뷰어 주소 |
| `renderMyInquiries` | `() => ReactNode` | — | 상담 창 안에서 보여 줄 "내 문의" 목록 화면(**미지정 시 진입 버튼도 숨긴다**) |
| `myInquiryBadgeCount` | `number` | `0` | "내 문의" 진입 버튼에 붙일 미확인 건수(0 이하면 배지 없음) |
| `brand` | [`ChatbotBrandConfig`](#chatbotbrandconfig) | 코드샵 기본 | 상담 창 빈 화면의 로고·인사말 브랜딩 |

### ChatbotBrandConfig

다른 서비스가 패키지를 그대로 쓸 때 코드샵 로고·문구를 바꾸는 옵션이다(0.5.1). 모두 선택값이다.

| 필드 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `name` | `string` | `"코드샵"` | 인사말 "안녕하세요, {name} 상담 챗봇입니다" 의 서비스 이름 |
| `logo` | `ReactNode` | — | 로고 노드(있으면 `logoSrc` 대신 그린다 — SVG 컴포넌트 로고용) |
| `logoSrc` | `string` | `"/codeshop/favicon.svg"` | 로고 이미지 주소 |
| `logoAlt` | `string` | `name` 또는 `"codeshop"` | 로고 이미지 alt |
| `welcomeTitle` | `string` | name 조합 | 인사말 전체(있으면 `name` 조합보다 우선) |
| `welcomeSubtitle` | `ReactNode` | 코드샵 안내 문구 | 인사말 아래 안내 문구 |

> ⚠️ `useSelectOptions` 는 렌더마다 같은 자리에서 호출되므로 참조가 안정적인 함수(모듈 스코프 훅)를 넘긴다.
> `config` 객체 자체도 `useMemo` 로 고정한다.

#### renderMyInquiries — 내 문의 목록

문의 목록과 그 조회 API 는 앱마다 다르므로 패키지가 갖지 않는다. 앱이 만든 화면을 그대로 받아 상담 창 안에 끼운다.

**이 값을 넘기지 않으면 화면도 진입 버튼도 없다.** 그래서 "누구에게 보일지" 판정은 전적으로 앱 몫이다 —
예를 들어 문의를 받아서 답하는 본사 계정에는 넘기지 않으면 된다. 패키지는 그 판정을 하지 않는다.

```tsx
<ChatbotProvider
    config={{
        // 본사는 문의를 받는 쪽이라 목록을 넘기지 않는다 → 상담 창에 진입 버튼이 뜨지 않는다.
        renderMyInquiries: isHeadOffice ? undefined : () => <MyInquiryPanel />,
        myInquiryBadgeCount: unreadAnswerCount,
    }}
>
```

진입 버튼 자리는 화면 폭에 따라 다르다.

| 폭 | 진입 지점 | 배지 |
| --- | --- | --- |
| `sm` 이상 | 제목바의 목록 아이콘 | 그 아이콘에 표시 |
| `sm` 미만(창이 화면을 꽉 채움) | 제목바 `⋮` → `내 문의보기` | `⋮` 와 메뉴 항목에 표시 |

`sm` 미만에서는 `새 대화`·`이전 대화` 도 같은 `⋮` 메뉴로 들어간다 — 제목이 잘리지 않게 하기 위해서다.

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

### ChatbotHostView

앱 레이아웃에 상주시키는 호스트다 — 상담 드로어 + 지식 편집 창을 함께 띄운다. props 없음.
**앱 전체에 하나만** 마운트한다.

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

### ChatbotManageRoutePage

관리 페이지를 딥링크(`?knowledge=<seq>`) 해석까지 포함해 감싼 라우트용 껍데기다.
라우터 훅을 뚫지 않고 라우트에 그대로 걸 수 있다.

| prop | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `knowledgeQueryKey` | `string` | `"knowledge"` | 딥링크 쿼리 키 |
| `onInitialKnowledgeConsumed` | `() => void` | `history.replaceState` 로 쿼리 제거 | 딥링크 소비 후 처리 |

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

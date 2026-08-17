# @ehfuse/chatbot-ui

React/MUI 챗봇 UI 패키지. 상담 대화창(드로어·팝업 창)과 지식 관리 콘솔(5탭)을 함께 제공한다.

앱에 매인 것(로그인 계정·라우터·파일 뷰어·자동완성 옵션 원본)은 전부 `ChatbotProvider` 로 주입받으므로,
패키지는 백엔드 `/v1/chatbot/*` API 와 `entity-client` 만 알면 동작한다.

## 설치

```bash
npm install @ehfuse/chatbot-ui
```

peer 의존: `react`, `react-dom`, `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`,
`@ehfuse/forma`, `@ehfuse/alerts`, `@ehfuse/mui-form-controls`, `@ehfuse/mui-form-dialog`,
`@ehfuse/overlay-scrollbar`, `@ehfuse/taskbox`, `entity-client`, `react-markdown`, `remark-gfm`, `react-virtuoso`

## 빠른 사용

```tsx
import { ChatbotProvider, ChatbotDrawer, KnowledgeDialogHost } from "@ehfuse/chatbot-ui";

<ChatbotProvider config={{ account, headOfficeLicenseSeq: 101 }}>
    <ChatbotDrawer />
    <KnowledgeDialogHost />
</ChatbotProvider>;
```

## 주요 export

### Provider

| export | 시그니처 |
| --- | --- |
| `ChatbotProvider` | `(props: ChatbotProviderProps) => JSX.Element` |
| `useChatbotConfig` | `() => ChatbotConfig` |
| `useChatbotAccount` | `() => ChatbotAccount \| null` |
| `useIsTrainer` | `() => boolean` |
| `useIsHeadOffice` | `() => boolean` |
| `useChatbotSelectOptions` | `(optionType: string) => ChatbotSelectOptions` |
| `useChatbotFormDialog` | `() => ComponentType<any>` |
| `useChatbotNavigate` | `() => (path: string) => void` |

### 화면

| export | 시그니처 |
| --- | --- |
| `ChatbotDrawer` | `() => JSX.Element` — 오른쪽 상담 드로어 |
| `ChatPanel` | `(props: { onClose?, onOpenPopup? }) => JSX.Element` — 드로어/팝업 공용 본문 |
| `ChatPopupPage` | `() => JSX.Element` — 상담 팝업 창 단독 페이지 |
| `ChatbotManagePage` | `(props: ChatbotManagePageProps) => JSX.Element` — 관리 5탭 |
| `KnowledgeDialogHost` | `() => JSX.Element \| null` — 지식 편집 창 전역 호스트 |

### 상태·API

| export | 시그니처 |
| --- | --- |
| `useChatbotController` | `() => { state }` — 상담 상태(`chatbotState`) |
| `useChatbotManageController` | `() => { state, form, modals, ... }` — 관리 상태(`chatbotManageState`) |
| `chatbotManageApi` | 관리 API 묶음 |
| `useChatRealtime` | `(handlers: ChatRealtimeHandlers) => void` |
| `openChatPopup` | `(path?: string) => boolean` |
| `openKnowledgeDialogBySeq` | `(seq: number) => boolean` |
| `registerKnowledgeDialogOpener` | `(fn: (seq: number) => void) => () => void` |

자세한 설명은 [docs/ko](./docs/ko/getting-started.md) 를 본다.

## 라이선스

MIT

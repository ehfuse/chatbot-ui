# 시작하기

`@ehfuse/chatbot-ui` 는 상담 대화창과 지식 관리 콘솔을 함께 담은 React/MUI 패키지다.

## 1. 백엔드 전제

패키지는 앱 서버의 `/v1/chatbot/*` 라우트를 호출한다(`entity-client` 의 `entityAppServer.http`).
필요한 엔드포인트는 다음과 같다.

| 메서드 | 경로 | 용도 |
| --- | --- | --- |
| `POST` | `/v1/chatbot/chat` | 메시지 전송(스트리밍은 realtime 으로 청크 수신) |
| `GET` `POST` | `/v1/chatbot/sessions` | 세션 목록 / 새 세션 |
| `GET` `DELETE` | `/v1/chatbot/sessions/:seq` | 세션 상세 / 보관 |
| `POST` `DELETE` | `/v1/chatbot/feedback` | 답변 피드백 등록 / 삭제 |
| `POST` | `/v1/chatbot/inquiry/draft`, `/v1/chatbot/inquiry` | 문의 초안 / 등록 |
| `GET` `POST` `DELETE` | `/v1/chatbot/knowledge...` | 지식 관리(교육자 전용) |

## 2. 설치

```bash
npm install @ehfuse/chatbot-ui
```

## 3. Provider 로 감싸기

앱에 매인 값은 모두 `config` 로 주입한다. 전부 선택이며, 없으면 각 지점이 기본값으로 동작한다.

```tsx
import { ChatbotProvider } from "@ehfuse/chatbot-ui";

function Layout() {
    const { state: loginState } = useLoginController();
    const account = loginState.useValue("account");

    // ⚠️ config 객체는 매 렌더 새로 만들지 말고 useMemo 로 고정한다.
    const chatbotConfig = useMemo(
        () => ({
            account,
            headOfficeLicenseSeq: 101,
            getRequestHeaders: getRealtimeConnectionRequestHeaders,
            openImageViewer: openInAppFileViewer,
            useSelectOptions: useDeletableSelectOptions,
            navigate: (path: string) => navigate(path),
        }),
        [account, navigate]
    );

    return (
        <ChatbotProvider config={chatbotConfig}>
            <ChatbotDrawer />
            <KnowledgeDialogHost />
        </ChatbotProvider>
    );
}
```

## 4. 화면 붙이기

- **상담 드로어**: `<ChatbotDrawer />` 를 레이아웃에 상주시키고, 열기는
  `useChatbotController().state.setValue("isDrawerOpen", true)` 로 한다.
- **팝업 창 페이지**: 라우터에 `/chatbot` 경로를 만들어 `<ChatPopupPage />` 를 띄운다.
  경로를 바꾸려면 `config.chatPopupPath` 도 함께 바꾼다.
- **관리 페이지**: 라우트에 `<ChatbotManagePage />` 를 놓는다. 교육자가 아니면 안내만 표시한다.
- **지식 편집 창**: `<KnowledgeDialogHost />` 를 앱 전체에 **하나만** 마운트한다.
  둘 이상 마운트하면 같은 `modalId` 를 두 인스턴스가 잡아 열림/닫힘이 어긋난다.

## 5. 딥링크로 특정 지식 열기

관리 페이지는 라우터를 모른다. 쿼리 해석은 소비처가 하고 seq 만 넘긴다.

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const knowledgeSeq = Number(searchParams.get("knowledge") ?? 0);

<ChatbotManagePage
    initialKnowledgeSeq={knowledgeSeq}
    onInitialKnowledgeConsumed={() => {
        searchParams.delete("knowledge");
        setSearchParams(searchParams, { replace: true });
    }}
/>;
```

---

## 관련 문서

- [시작하기](./getting-started.md)
- [API](./api.md)
- [예제](./example.md)

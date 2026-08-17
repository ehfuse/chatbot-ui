# 예제

## 목차

- [레이아웃에 상담 드로어 붙이기](#레이아웃에-상담-드로어-붙이기)
- [헤더 버튼으로 드로어 열기](#헤더-버튼으로-드로어-열기)
- [팝업 창 라우트](#팝업-창-라우트)
- [관리 페이지 + 딥링크](#관리-페이지--딥링크)
- [자동완성 옵션 주입](#자동완성-옵션-주입)
- [첨부 이미지 뷰어 주입](#첨부-이미지-뷰어-주입)

---

## 레이아웃에 상담 드로어 붙이기

`ChatbotProvider` 는 상담 드로어와 지식 편집 호스트를 함께 감싼다. 지식 편집 호스트를 여기 두면
상담 말풍선의 "사용된 지식" 링크가 새 탭 대신 현재 탭에서 창으로 열린다.

```tsx
import { useMemo } from "react";
import { ChatbotProvider, ChatbotDrawer, KnowledgeDialogHost } from "@ehfuse/chatbot-ui";

export function DashboardHeader() {
    const { state: loginState } = useLoginController();
    const account = loginState.useValue("account");

    const chatbotConfig = useMemo(
        () => ({ account, headOfficeLicenseSeq: 101 }),
        [account]
    );

    return (
        <ChatbotProvider config={chatbotConfig}>
            <ChatbotDrawer />
            <KnowledgeDialogHost />
        </ChatbotProvider>
    );
}
```

## 헤더 버튼으로 드로어 열기

열림 여부는 상담 상태(`chatbotState.isDrawerOpen`)가 소유한다.

```tsx
import { useChatbotController } from "@ehfuse/chatbot-ui";

function ChatButton() {
    const { state } = useChatbotController();
    return <IconButton onClick={() => state.setValue("isDrawerOpen", true)}>상담하기</IconButton>;
}
```

## 팝업 창 라우트

기본 경로는 `/chatbot` 이다. 다른 경로를 쓰면 `config.chatPopupPath` 도 함께 바꾼다
(팝업 안에서는 앱의 전역 파일 뷰어가 없다는 판정을 이 경로로 한다).

```tsx
<Route path="/chatbot" element={<ChatPopupPage />} />
```

## 관리 페이지 + 딥링크

```tsx
import { useSearchParams } from "react-router-dom";
import { ChatbotManagePage } from "@ehfuse/chatbot-ui";

export default function ChatbotManageRoute() {
    const [searchParams, setSearchParams] = useSearchParams();
    const knowledgeSeq = Number(searchParams.get("knowledge") ?? 0);

    return (
        <ChatbotManagePage
            initialKnowledgeSeq={knowledgeSeq}
            onInitialKnowledgeConsumed={() => {
                searchParams.delete("knowledge");
                setSearchParams(searchParams, { replace: true });
            }}
        />
    );
}
```

## 자동완성 옵션 주입

지식 분류는 저장할 때마다 앱의 옵션 목록에 쌓인다. 그 목록의 원본은 앱이 가지고 있으므로,
패키지는 조회 훅을 주입받고 새 값이 생기면 `onSelectOptionAdded` 로 알리기만 한다.

```tsx
const chatbotConfig = useMemo(
    () => ({
        account,
        useSelectOptions: useDeletableSelectOptions, // (optionType) => { values, renderOption }
        onSelectOptionAdded: (optionType, value) => patchBootstrapSelectOption(optionType, value),
    }),
    [account]
);
```

## 첨부 이미지 뷰어 주입

주입하지 않으면 첨부는 새 탭으로 열린다. 앱에 전역 파일 뷰어가 있으면 인앱 확대로 바꾼다.

```tsx
const chatbotConfig = useMemo(
    () => ({
        account,
        openImageViewer: (src, index) =>
            fileViewerStore.requestOpen({ name: `상담-첨부-${index + 1}.webp`, previewUrl: src }),
        buildFileViewerUrl: (uuid, name) => `/file-viewer/${uuid}?name=${encodeURIComponent(name)}`,
    }),
    [account]
);
```

---

## 관련 문서

- [시작하기](./getting-started.md)
- [API](./api.md)
- [예제](./example.md)

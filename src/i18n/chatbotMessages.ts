/** 상담 화면 문구 — 언어별 번들이다(관리 콘솔은 본사 직원용이라 한국어 그대로 둔다). */

/** 지원 언어 — 모르는 값은 한국어로 떨어진다 */
export type ChatbotLocale = "ko" | "en" | "ja" | "mn" | "kk";

/** 상담 화면 문구 모음 */
export interface ChatbotMessages {
    loadFailed: string; // 대화 불러오기 실패
    newChatFailed: string; // 새 대화 시작 실패
    deleteFailed: string; // 대화 삭제 실패
    sendFailed: string; // 전송 실패
    answerFailed: string; // 답변 생성 실패
    enterFirst: string; // 문의 초안 전 상담 내용 없음
    draftFailed: string; // 초안 생성 실패
    inquiryDraftFailed: string; // 문의 초안 생성 실패
    inquiryFailed: string; // 문의 등록 실패
    popupBlocked: string; // 팝업 차단
    justNow: string; // 방금
    unknownDate: string; // 날짜 미상
    attachmentFile: string; // 첨부 파일 이름 앞부분
    code: string; // 미리보기의 코드 블록 자리
    back: string; // 뒤로
    close: string; // 닫기
    previousChats: string; // 이전 대화
    myInquiries: string; // 내 문의
    inquiryRegister: string; // 고객센터 등록(화면 제목)
    consult: string; // 상담하기
    trainerMode: string; // (학습모드)
    menu: string; // 메뉴
    newChat: string; // 새 대화
    viewMyInquiries: string; // 내 문의보기
    openNewWindow: string; // 새 창으로 열기
    bot: string; // 상담봇
    removeAttachment: string; // 첨부 제거
    dropHere: string; // 끌어다 놓기 안내
    inputPlaceholder: string; // 입력 칸 안내
    attachImage: string; // 이미지 첨부
    send: string; // 보내기
    helpful: string; // 도움이 됐어요
    notHelpful: string; // 도움이 안 됐어요
    inquiryCheck: string; // 문의 초안 확인 안내
    title: string; // 제목
    content: string; // 내용
    inquiryImages: string; // 첨부 이미지 {n}장
    cancel: string; // 취소
    register: string; // 등록하기
    optionAnswer: string; // (선택지 응답)
    attachedImage: string; // 첨부 이미지(alt)
    clickToEnlarge: string; // 눌러서 크게 보기
    edit: string; // 수정하기
    welcome: string; // 안녕하세요, {name} 상담 챗봇입니다
    welcomeLine1: string; // 인사말 아래 첫 줄
    welcomeLine2: string; // 인사말 아래 둘째 줄
    recentChats: string; // 최근 대화
    consultFallback: string; // 제목 없는 대화
    messageCount: string; // 메시지 {n}건
    allPreviousChats: string; // 이전 대화 모두 보기
    questionCopied: string; // 질문 복사 안내
    similarity: string; // 유사도 {n}%
    collapse: string; // 접기
    viewContent: string; // 내용 보기
    editKnowledge: string; // 이 지식을 수정
    noPreviousChats: string; // 이전 대화 없음
    deleteChat: string; // 대화 삭제
    usedKnowledge: string; // 사용된 지식:
}

/** 언어별 문구 */
export const CHATBOT_MESSAGES: Record<ChatbotLocale, ChatbotMessages> = {
    ko: {
        loadFailed: "대화를 불러오지 못했습니다.",
        newChatFailed: "새 대화를 시작하지 못했습니다.",
        deleteFailed: "대화를 삭제하지 못했습니다.",
        sendFailed: "전송에 실패했습니다.",
        answerFailed: "답변 생성에 실패했습니다. 다시 시도해주세요.",
        enterFirst: "먼저 상담 내용을 입력해주세요.",
        draftFailed: "초안 생성에 실패했습니다.",
        inquiryDraftFailed: "문의 초안 생성에 실패했습니다.",
        inquiryFailed: "문의 등록에 실패했습니다.",
        popupBlocked: "팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제해주세요.",
        justNow: "방금",
        unknownDate: "날짜 미상",
        attachmentFile: "상담-첨부",
        code: "코드",
        back: "뒤로",
        close: "닫기",
        previousChats: "이전 대화",
        myInquiries: "내 문의",
        inquiryRegister: "고객센터 등록",
        consult: "상담하기",
        trainerMode: "학습모드",
        menu: "메뉴",
        newChat: "새 대화",
        viewMyInquiries: "내 문의보기",
        openNewWindow: "새 창으로 열기",
        bot: "상담봇",
        removeAttachment: "첨부 제거",
        dropHere: "여기에 놓으면 이미지가 첨부됩니다",
        inputPlaceholder: "궁금한 내용을 입력하세요",
        attachImage: "이미지 첨부",
        send: "보내기",
        helpful: "도움이 됐어요",
        notHelpful: "도움이 안 됐어요",
        inquiryCheck: "아래 내용을 확인하고 필요하면 고쳐주세요.",
        title: "제목",
        content: "내용",
        inquiryImages: "대화에 첨부한 이미지 {n}장이 함께 등록됩니다.",
        cancel: "취소",
        register: "등록하기",
        optionAnswer: "(선택지 응답)",
        attachedImage: "첨부 이미지",
        clickToEnlarge: "클릭하면 원본을 크게 볼 수 있습니다",
        edit: "수정하기",
        welcome: "안녕하세요, {name} 상담 챗봇입니다",
        welcomeLine1: "사용법 · 메뉴 위치 · 상황 대처 · 장애 대응까지",
        welcomeLine2: "무엇이든 물어보세요.",
        recentChats: "최근 대화",
        consultFallback: "상담",
        messageCount: "메시지 {n}건",
        allPreviousChats: "이전 대화 모두 보기",
        questionCopied: "질문을 복사했어요. 열린 창에 붙여넣기 하세요.",
        similarity: "유사도 {n}%",
        collapse: "접기",
        viewContent: "내용 보기",
        editKnowledge: "이 지식을 수정",
        noPreviousChats: "이전 대화가 없습니다.",
        deleteChat: "대화 삭제",
        usedKnowledge: "사용된 지식:",
    },
    en: {
        loadFailed: "Couldn't load the conversation.",
        newChatFailed: "Couldn't start a new chat.",
        deleteFailed: "Couldn't delete the conversation.",
        sendFailed: "Couldn't send.",
        answerFailed: "Couldn't create an answer. Please try again.",
        enterFirst: "Please type your question first.",
        draftFailed: "Couldn't create a draft.",
        inquiryDraftFailed: "Couldn't create the inquiry draft.",
        inquiryFailed: "Couldn't submit the inquiry.",
        popupBlocked: "The pop-up was blocked. Please allow pop-ups in your browser.",
        justNow: "Just now",
        unknownDate: "Unknown date",
        attachmentFile: "chat-attachment",
        code: "code",
        back: "Back",
        close: "Close",
        previousChats: "Previous chats",
        myInquiries: "My inquiries",
        inquiryRegister: "Contact support",
        consult: "Chat",
        trainerMode: "training mode",
        menu: "Menu",
        newChat: "New chat",
        viewMyInquiries: "View my inquiries",
        openNewWindow: "Open in a new window",
        bot: "Assistant",
        removeAttachment: "Remove attachment",
        dropHere: "Drop here to attach the image",
        inputPlaceholder: "Ask me anything",
        attachImage: "Attach image",
        send: "Send",
        helpful: "Helpful",
        notHelpful: "Not helpful",
        inquiryCheck: "Please check the details below and edit if needed.",
        title: "Title",
        content: "Details",
        inquiryImages: "{n} image(s) from the chat will be included.",
        cancel: "Cancel",
        register: "Submit",
        optionAnswer: "(selected option)",
        attachedImage: "Attached image",
        clickToEnlarge: "Click to view the original",
        edit: "Edit",
        welcome: "Hello, this is the {name} assistant",
        welcomeLine1: "How to use the app, where to find things, what to do next",
        welcomeLine2: "Ask me anything.",
        recentChats: "Recent chats",
        consultFallback: "Chat",
        messageCount: "{n} messages",
        allPreviousChats: "See all previous chats",
        questionCopied: "Question copied. Paste it into the window that opened.",
        similarity: "Similarity {n}%",
        collapse: "Collapse",
        viewContent: "View",
        editKnowledge: "Edit this knowledge",
        noPreviousChats: "No previous chats.",
        deleteChat: "Delete chat",
        usedKnowledge: "Knowledge used:",
    },
    ja: {
        loadFailed: "会話を読み込めませんでした。",
        newChatFailed: "新しい会話を始められませんでした。",
        deleteFailed: "会話を削除できませんでした。",
        sendFailed: "送信できませんでした。",
        answerFailed: "回答を作成できませんでした。もう一度お試しください。",
        enterFirst: "先にご相談内容を入力してください。",
        draftFailed: "下書きを作成できませんでした。",
        inquiryDraftFailed: "問い合わせの下書きを作成できませんでした。",
        inquiryFailed: "問い合わせを登録できませんでした。",
        popupBlocked: "ポップアップがブロックされました。ブラウザのポップアップブロックを解除してください。",
        justNow: "たった今",
        unknownDate: "日付不明",
        attachmentFile: "相談-添付",
        code: "コード",
        back: "戻る",
        close: "閉じる",
        previousChats: "過去の会話",
        myInquiries: "マイ問い合わせ",
        inquiryRegister: "サポートに問い合わせ",
        consult: "相談する",
        trainerMode: "学習モード",
        menu: "メニュー",
        newChat: "新しい会話",
        viewMyInquiries: "マイ問い合わせを見る",
        openNewWindow: "新しいウィンドウで開く",
        bot: "相談ボット",
        removeAttachment: "添付を削除",
        dropHere: "ここにドロップすると画像を添付します",
        inputPlaceholder: "知りたいことを入力してください",
        attachImage: "画像を添付",
        send: "送信",
        helpful: "役に立った",
        notHelpful: "役に立たなかった",
        inquiryCheck: "以下の内容を確認し、必要なら修正してください。",
        title: "件名",
        content: "内容",
        inquiryImages: "会話に添付した画像{n}枚も一緒に登録されます。",
        cancel: "キャンセル",
        register: "登録する",
        optionAnswer: "(選択肢の回答)",
        attachedImage: "添付画像",
        clickToEnlarge: "クリックすると原寸で表示します",
        edit: "修正する",
        welcome: "こんにちは、{name} 相談チャットボットです",
        welcomeLine1: "使い方・メニューの場所・困ったときの対処まで",
        welcomeLine2: "何でも聞いてください。",
        recentChats: "最近の会話",
        consultFallback: "相談",
        messageCount: "メッセージ {n}件",
        allPreviousChats: "過去の会話をすべて見る",
        questionCopied: "質問をコピーしました。開いたウィンドウに貼り付けてください。",
        similarity: "類似度 {n}%",
        collapse: "閉じる",
        viewContent: "内容を見る",
        editKnowledge: "このナレッジを修正",
        noPreviousChats: "過去の会話はありません。",
        deleteChat: "会話を削除",
        usedKnowledge: "使われたナレッジ:",
    },
    mn: {
        loadFailed: "Яриаг ачаалж чадсангүй.",
        newChatFailed: "Шинэ яриа эхлүүлж чадсангүй.",
        deleteFailed: "Яриаг устгаж чадсангүй.",
        sendFailed: "Илгээж чадсангүй.",
        answerFailed: "Хариулт үүсгэж чадсангүй. Дахин оролдоно уу.",
        enterFirst: "Эхлээд асуултаа бичнэ үү.",
        draftFailed: "Ноорог үүсгэж чадсангүй.",
        inquiryDraftFailed: "Хүсэлтийн ноорог үүсгэж чадсангүй.",
        inquiryFailed: "Хүсэлтийг бүртгэж чадсангүй.",
        popupBlocked: "Попап цонх хаагдлаа. Хөтчийн попап хаалтыг цуцална уу.",
        justNow: "Дөнгөж сая",
        unknownDate: "Огноо тодорхойгүй",
        attachmentFile: "chat-attachment",
        code: "код",
        back: "Буцах",
        close: "Хаах",
        previousChats: "Өмнөх яриа",
        myInquiries: "Миний хүсэлт",
        inquiryRegister: "Тусламжид хандах",
        consult: "Зөвлөгөө",
        trainerMode: "сургалтын горим",
        menu: "Цэс",
        newChat: "Шинэ яриа",
        viewMyInquiries: "Миний хүсэлтийг харах",
        openNewWindow: "Шинэ цонхонд нээх",
        bot: "Туслах",
        removeAttachment: "Хавсралтыг хасах",
        dropHere: "Энд тавьбал зураг хавсрагдана",
        inputPlaceholder: "Асуух зүйлээ бичнэ үү",
        attachImage: "Зураг хавсаргах",
        send: "Илгээх",
        helpful: "Тустай байлаа",
        notHelpful: "Тустай байсангүй",
        inquiryCheck: "Доорх агуулгыг шалгаж, шаардлагатай бол засна уу.",
        title: "Гарчиг",
        content: "Агуулга",
        inquiryImages: "Ярианд хавсаргасан {n} зураг хамт бүртгэгдэнэ.",
        cancel: "Болих",
        register: "Бүртгэх",
        optionAnswer: "(сонголтын хариу)",
        attachedImage: "Хавсаргасан зураг",
        clickToEnlarge: "Дарж томоор харна уу",
        edit: "Засах",
        welcome: "Сайн байна уу, {name} туслах чатбот байна",
        welcomeLine1: "Хэрэглэх арга, цэсний байршил, юу хийх тухай",
        welcomeLine2: "Юу ч хамаагүй асуугаарай.",
        recentChats: "Сүүлийн яриа",
        consultFallback: "Зөвлөгөө",
        messageCount: "{n} мессеж",
        allPreviousChats: "Өмнөх бүх яриаг харах",
        questionCopied: "Асуултыг хууллаа. Нээгдсэн цонхонд буулгана уу.",
        similarity: "Төстэй байдал {n}%",
        collapse: "Хураах",
        viewContent: "Агуулгыг харах",
        editKnowledge: "Энэ мэдлэгийг засах",
        noPreviousChats: "Өмнөх яриа байхгүй.",
        deleteChat: "Яриаг устгах",
        usedKnowledge: "Ашигласан мэдлэг:",
    },
    kk: {
        loadFailed: "Сөйлесуді жүктеу мүмкін болмады.",
        newChatFailed: "Жаңа сөйлесу бастау мүмкін болмады.",
        deleteFailed: "Сөйлесуді жою мүмкін болмады.",
        sendFailed: "Жіберу мүмкін болмады.",
        answerFailed: "Жауап жасау мүмкін болмады. Қайталап көріңіз.",
        enterFirst: "Алдымен сұрағыңызды жазыңыз.",
        draftFailed: "Жоба жасау мүмкін болмады.",
        inquiryDraftFailed: "Сұрау жобасын жасау мүмкін болмады.",
        inquiryFailed: "Сұрауды тіркеу мүмкін болмады.",
        popupBlocked: "Қалқымалы терезе бұғатталды. Браузерде қалқымалы терезелерге рұқсат беріңіз.",
        justNow: "Жаңа ғана",
        unknownDate: "Күні белгісіз",
        attachmentFile: "chat-attachment",
        code: "код",
        back: "Артқа",
        close: "Жабу",
        previousChats: "Бұрынғы сөйлесулер",
        myInquiries: "Менің сұрауларым",
        inquiryRegister: "Қолдау қызметіне жүгіну",
        consult: "Кеңес",
        trainerMode: "оқыту режимі",
        menu: "Мәзір",
        newChat: "Жаңа сөйлесу",
        viewMyInquiries: "Менің сұрауларымды көру",
        openNewWindow: "Жаңа терезеде ашу",
        bot: "Көмекші",
        removeAttachment: "Тіркемені алып тастау",
        dropHere: "Суретті тіркеу үшін осында тастаңыз",
        inputPlaceholder: "Сұрағыңызды жазыңыз",
        attachImage: "Сурет тіркеу",
        send: "Жіберу",
        helpful: "Пайдалы болды",
        notHelpful: "Пайдасы болмады",
        inquiryCheck: "Төмендегі мәліметті тексеріп, қажет болса түзетіңіз.",
        title: "Тақырып",
        content: "Мазмұны",
        inquiryImages: "Сөйлесуге тіркелген {n} сурет бірге тіркеледі.",
        cancel: "Бас тарту",
        register: "Тіркеу",
        optionAnswer: "(таңдау жауабы)",
        attachedImage: "Тіркелген сурет",
        clickToEnlarge: "Үлкейтіп көру үшін басыңыз",
        edit: "Өзгерту",
        welcome: "Сәлеметсіз бе, бұл {name} көмекші чатботы",
        welcomeLine1: "Қолдану тәсілі, мәзір орны, не істеу керегі туралы",
        welcomeLine2: "Кез келген сұрақ қойыңыз.",
        recentChats: "Соңғы сөйлесулер",
        consultFallback: "Кеңес",
        messageCount: "{n} хабар",
        allPreviousChats: "Барлық бұрынғы сөйлесулерді көру",
        questionCopied: "Сұрақ көшірілді. Ашылған терезеге қойыңыз.",
        similarity: "Ұқсастық {n}%",
        collapse: "Жию",
        viewContent: "Мазмұнын көру",
        editKnowledge: "Бұл білімді өзгерту",
        noPreviousChats: "Бұрынғы сөйлесулер жоқ.",
        deleteChat: "Сөйлесуді жою",
        usedKnowledge: "Пайдаланылған білім:",
    },
};

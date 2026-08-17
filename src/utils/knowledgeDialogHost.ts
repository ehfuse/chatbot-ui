/**
 * knowledgeDialogHost.ts
 *
 * 지식 편집 다이얼로그를 화면 아무 데서나 열기 위한 opener 등록소다.
 *
 * 상담 말풍선의 "사용된 지식" 링크는 챗봇 관리 페이지 밖(드로어/팝업)에서 눌리는데,
 * 다이얼로그를 열려면 관리 컨트롤러가 필요하다. 말풍선마다 컨트롤러 훅을 부르면
 * 메시지 수만큼 전역 상태를 구독하게 되므로, 전역 호스트가 opener 를 한 번 등록하고
 * 소비처는 이 함수만 호출한다.
 */

/** 현재 마운트된 호스트가 등록한 열기 함수 (없으면 null) */
let opener: ((seq: number) => void) | null = null;

/** 호스트가 열기 함수를 등록한다. 반환값을 호출하면 해제된다. */
export function registerKnowledgeDialogOpener(fn: (seq: number) => void): () => void {
    opener = fn;
    return () => {
        // 다른 호스트가 이미 자리를 넘겨받았으면 건드리지 않는다.
        if (opener === fn) opener = null;
    };
}

/** 지식 편집 다이얼로그를 연다. 호스트가 없으면 false 를 돌려준다(호출부가 폴백). */
export function openKnowledgeDialogBySeq(seq: number): boolean {
    if (!opener || !seq) return false;
    opener(seq);
    return true;
}

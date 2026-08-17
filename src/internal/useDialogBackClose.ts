/**
 * 다이얼로그를 기기(브라우저) 뒤로가기로 닫히게 해주는 훅이다 (패키지 내부 전용).
 *
 * mfd `FormDialog` 와 MUI `Dialog`/`Drawer` 는 히스토리를 건드리지 않는다. 그래서 열림 상태를
 * 자체 state 로만 관리하는 다이얼로그는 뒤로가기가 다이얼로그가 아니라 라우트를 되돌려 화면을 벗어난다.
 * forma `useModal` 은 열 때 히스토리를 한 칸 쌓고 popstate 를 가로채 그 모달만 닫는데,
 * 이 훅은 그 장치를 "이미 있는 열림 상태"에 얹어준다.
 *
 * ⚠️ `modalId` 는 동시에 마운트되는 인스턴스마다 달라야 한다. 같은 id 를 둘이 쓰면 한쪽이 등록하고
 *    다른 쪽이 닫아 히스토리 칸이 어긋난다(forma useModal 의 알려진 함정).
 */

import { useCallback, useEffect, useRef } from "react";
import { useModal } from "@ehfuse/forma";

/** 뒤로가기 닫기 훅 옵션이다. */
export interface DialogBackCloseOptions {
    open: boolean; // 현재 열림 여부(표시 여부의 원본은 소비처가 계속 소유한다)
    onClose: () => void; // 닫아야 할 때 호출된다(뒤로가기·requestClose 공통)
    modalId?: string; // 모달 식별자(생략하면 인스턴스마다 자동 생성)
}

/** 뒤로가기 닫기 훅 반환값이다. */
export interface DialogBackCloseControl {
    requestClose: () => void; // ← 버튼/백드롭 닫기에 연결한다
}

/** 다이얼로그를 기기 뒤로가기로 닫을 수 있게 forma 모달 히스토리에 등록한다. */
export function useDialogBackClose({ open, onClose, modalId }: DialogBackCloseOptions): DialogBackCloseControl {
    // 콜백은 렌더마다 새로 만들어져 오므로 ref 로 최신값만 참조한다(모달 등록을 흔들지 않기 위함).
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const modal = useModal({
        modalId,
        onClose: () => onCloseRef.current(),
    });
    const modalRef = useRef(modal);
    modalRef.current = modal;

    // 열림/닫힘 전이에서만 히스토리 칸을 맞춘다.
    const hadBackEntryRef = useRef(false);
    useEffect(() => {
        if (open && !hadBackEntryRef.current) {
            modalRef.current.open();
        } else if (!open && hadBackEntryRef.current && modalRef.current.isOpen) {
            // 뒤로가기가 아닌 경로로 닫혔으면 쌓아둔 칸도 함께 되돌린다.
            modalRef.current.close();
        }
        hadBackEntryRef.current = open;
    }, [open]);

    // ← 버튼/백드롭 닫기 — 등록돼 있으면 history.back 으로 칸을 소비하고, 아니면 그냥 상태만 내린다.
    const requestClose = useCallback(() => {
        if (modalRef.current.isOpen) {
            modalRef.current.close();
            return;
        }
        onCloseRef.current();
    }, []);

    return { requestClose };
}

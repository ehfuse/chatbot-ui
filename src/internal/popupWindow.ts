/**
 * 팝업 윈도우(새 탭이 아닌 별도 창) 열기 유틸이다 (패키지 내부 전용).
 *
 * 새 탭으로 열면 원래 화면을 가려 버려서, 대화창처럼 "띄워 두고 사이트를 계속 쓰는" 용도에는
 * 크기가 고정된 별도 창(window.open + popup 피처)이 맞다.
 */

/** 팝업 윈도우 열기 옵션이다. */
export interface PopupWindowOptions {
    name?: string; // 창 이름 — 같은 이름으로 다시 열면 기존 창을 재사용한다
    width?: number; // 창 너비(px)
    height?: number; // 창 높이(px)
}

/**
 * URL 을 팝업 윈도우로 연다. 현재 창 기준으로 가운데 배치하고, 이미 같은 이름의 창이 있으면
 * 그 창을 앞으로 가져온다. 팝업이 차단되면 null 을 반환한다.
 */
export function openPopupWindow(url: string, options: PopupWindowOptions = {}): Window | null {
    const { name = "_blank", width = 480, height = 780 } = options;

    // 듀얼 모니터에서도 현재 창이 있는 모니터에 뜨도록 현재 창의 화면 좌표를 기준으로 계산한다.
    const baseLeft = window.screenX ?? window.screenLeft ?? 0;
    const baseTop = window.screenY ?? window.screenTop ?? 0;
    const baseWidth = window.outerWidth || window.screen.availWidth || width;
    const baseHeight = window.outerHeight || window.screen.availHeight || height;
    const popupWidth = Math.min(width, window.screen.availWidth || width);
    const popupHeight = Math.min(height, window.screen.availHeight || height);
    const left = Math.max(0, Math.round(baseLeft + (baseWidth - popupWidth) / 2));
    const top = Math.max(0, Math.round(baseTop + (baseHeight - popupHeight) / 2));

    const features = [
        "popup=yes",
        `width=${popupWidth}`,
        `height=${popupHeight}`,
        `left=${left}`,
        `top=${top}`,
        "resizable=yes",
        "scrollbars=yes",
    ].join(",");

    const popup = window.open(url, name, features);
    popup?.focus();
    return popup;
}

/** 누적 옵션 값을 Autocomplete 옵션으로 변환하는 유틸이다 (패키지 내부 전용). */

import type { AutocompleteOption } from "@ehfuse/mui-form-controls";

/** 문자열 배열을 자동완성 옵션 배열로 정규화한다(중복 제거·가나다순). */
export function buildStringAutocompleteOptions(values: string[]): AutocompleteOption[] {
    return values
        .map((value) => String(value ?? "").trim())
        .filter((value, index, array) => Boolean(value) && array.indexOf(value) === index)
        .sort((left, right) => left.localeCompare(right, "ko"))
        .map((value) => ({ value, label: value }));
}

/** 누적 옵션에 현재 입력값을 합쳐 자동완성 옵션을 만든다(아직 저장 안 된 값도 보이게). */
export function mergeAutocompleteOptions(baseValues: string[], currentValue: unknown): AutocompleteOption[] {
    const mergedValues = [...baseValues];
    const normalizedCurrentValue = String(currentValue ?? "").trim();
    if (normalizedCurrentValue) {
        mergedValues.push(normalizedCurrentValue);
    }
    return buildStringAutocompleteOptions(mergedValues);
}

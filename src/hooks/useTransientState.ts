"use client";

import { useLayoutEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * 모달 · 드롭다운처럼 "잠깐 열리는" UI 상태용 useState.
 *
 * cacheComponents 가 켜진 Next 16은 다른 화면으로 이동해도 이전 화면을 없애지 않고 <Activity> 로 숨겨둔다.
 * 그래서 일반 useState 는 뒤로가기로 돌아왔을 때 "열린 채"로 남는다.
 * 이 훅은 화면이 숨겨질 때(useLayoutEffect 정리 함수) 값을 처음 값으로 되돌린다.
 * 참고: node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md
 */
export function useTransientState<T>(initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);

  useLayoutEffect(() => {
    return () => setValue(initial);
  }, [initial]);

  return [value, setValue];
}

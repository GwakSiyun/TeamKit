"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Notice } from "@/components/ui/Notice";
import { useAuth } from "../AuthProvider";
import { isGithubLinked, linkGithub, refreshGithubToken } from "../services";

/** 계정 설정의 GitHub 줄: 연결 안 됐으면 "GitHub 연결", 연결됐으면 토큰을 새로 받는 "다시 연결" */
export function GithubLinkRow() {
  const { user } = useAuth();
  // linkWithPopup 은 onAuthStateChanged 를 다시 부르지 않으므로 연결 결과를 직접 반영한다.
  const [justLinked, setJustLinked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshed, setRefreshed] = useState(false);

  if (!user) return null;
  const linked = justLinked || isGithubLinked(user);

  async function handleClick(): Promise<void> {
    setPending(true);
    setError(null);
    setRefreshed(false);
    const result = linked ? await refreshGithubToken() : await linkGithub();
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (linked) setRefreshed(true);
    else setJustLinked(true);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 font-semibold">
            GitHub
            {linked && <span className="rounded bg-tint-green px-1.5 py-0.5 text-xs font-medium text-tint-green-fg">연결됨</span>}
          </span>
          <span className="text-xs text-muted">
            {linked ? "레포 연동에 사용해요. 레포 목록이 안 뜨면 '다시 연결'로 권한을 새로 받으세요." : "연결하면 레포·PR을 할 일에 반영할 수 있어요"}
          </span>
        </div>
        <button type="button" onClick={handleClick} disabled={pending} className={buttonClass("secondary")}>
          {pending ? "GitHub 창에서 계속하세요…" : linked ? "다시 연결" : "GitHub 연결"}
        </button>
      </div>
      {refreshed && <Notice tone="success">GitHub 권한을 새로 받았어요.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

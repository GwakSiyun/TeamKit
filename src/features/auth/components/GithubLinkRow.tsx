"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Notice } from "@/components/ui/Notice";
import { useAuth } from "../AuthProvider";
import { isGithubLinked, linkGithub } from "../services";

/** 이메일 계정에 GitHub 연결. 계정 설정 화면이 생기면 그쪽으로 옮긴다. */
export function GithubLinkRow() {
  const { user } = useAuth();
  // linkWithPopup 은 onAuthStateChanged 를 다시 부르지 않으므로 연결 결과를 직접 반영한다.
  const [justLinked, setJustLinked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const linked = justLinked || isGithubLinked(user);

  async function handleLink(): Promise<void> {
    setPending(true);
    setError(null);
    const result = await linkGithub();
    setPending(false);
    if (result.ok) setJustLinked(true);
    else setError(result.message);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">GitHub</span>
          <span className="text-xs text-muted">
            {linked ? "연결됨 · 레포 연동에 사용해요" : "연결하면 레포·PR을 할 일에 반영할 수 있어요"}
          </span>
        </div>
        {linked ? (
          <span className="rounded bg-[#DBEDDB] px-1.5 py-0.5 text-xs font-medium text-[#1C3829]">연결됨</span>
        ) : (
          <button type="button" onClick={handleLink} disabled={pending} className={buttonClass("secondary")}>
            {pending ? "GitHub 창에서 계속하세요…" : "GitHub 연결"}
          </button>
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

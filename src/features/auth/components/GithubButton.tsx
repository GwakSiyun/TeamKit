"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Notice } from "@/components/ui/Notice";
import { signInWithGithub } from "../services";

export function GithubButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    setPending(true);
    setError(null);
    const result = await signInWithGithub();
    setPending(false);
    if (result.ok) router.replace("/projects");
    else setError(result.message);
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={pending} className={buttonClass("secondary", "h-10 w-full")}>
        <GithubIcon />
        {pending ? "GitHub 창에서 계속하세요…" : label}
      </button>
      {error && <Notice tone="error">{error}</Notice>}
    </>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.8-2.3c2.8-.3 5.8-1.4 5.8-6.2a4.8 4.8 0 0 0-1.3-3.3 4.5 4.5 0 0 0-.1-3.3s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.1 5.8 2.4 5.8 2.4a4.5 4.5 0 0 0-.1 3.3A4.8 4.8 0 0 0 4.4 9c0 4.8 3 5.9 5.8 6.2a3 3 0 0 0-.8 2.3V21" />
    </svg>
  );
}

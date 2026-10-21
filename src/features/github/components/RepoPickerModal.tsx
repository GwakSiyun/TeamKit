"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { controlClass } from "@/components/ui/Field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { callGithubApi, type RepoItem } from "../api";

type Load = { status: "loading" } | { status: "ready"; repos: RepoItem[] } | { status: "error"; message: string };

export function RepoPickerModal({ onClose }: { onClose: () => void }) {
  const { project } = useCurrentProject();
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // 모달이 열릴 때 한 번 서버에서 레포 목록을 받는다 (GitHub 토큰은 서버만 씀)
  useEffect(() => {
    let alive = true;
    callGithubApi<{ repos: RepoItem[] }>("repos").then((r) => {
      if (alive) setLoad(r.ok ? { status: "ready", repos: r.repos } : { status: "error", message: r.message });
    });
    return () => {
      alive = false;
    };
  }, []);

  async function connect(): Promise<void> {
    if (!selected) return;
    setPending(true);
    setError(null);
    const r = await callGithubApi("connect", { projectId: project.id, fullName: selected });
    setPending(false);
    if (r.ok) onClose();
    else setError(r.message);
  }

  const repos = load.status === "ready" ? load.repos.filter((r) => r.fullName.toLowerCase().includes(query.trim().toLowerCase())) : [];

  return (
    <Modal open onClose={onClose} title="레포 선택" description="프로젝트에는 레포 1개만 연결할 수 있어요." width={520}>
      <ModalBody>
        {error && <Notice tone="error">{error}</Notice>}
        <label htmlFor="repo-search" className="sr-only">
          레포 검색
        </label>
        <input id="repo-search" className={controlClass(null, "h-9")} placeholder="레포 이름 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        {load.status === "loading" && <p className="py-6 text-center text-sm text-muted">GitHub에서 불러오는 중…</p>}
        {load.status === "error" && (
          <Notice tone="error">
            {load.message}{" "}
            <Link href="/account" className="font-semibold underline">
              계정 설정으로
            </Link>
          </Notice>
        )}
        {load.status === "ready" && (
          <div role="radiogroup" aria-label="레포" className="flex max-h-[300px] flex-col gap-0.5 overflow-auto">
            {repos.length === 0 && <p className="py-6 text-center text-sm text-muted">맞는 레포가 없어요</p>}
            {repos.map((r) => (
              <label
                key={r.fullName}
                className={`flex items-center gap-2.5 rounded-md px-2 py-2 ${r.admin ? "cursor-pointer hover:bg-side" : "cursor-not-allowed opacity-50"} ${
                  selected === r.fullName ? "bg-accent-soft" : ""
                }`}
              >
                <input
                  type="radio"
                  name="repo"
                  disabled={!r.admin}
                  checked={selected === r.fullName}
                  onChange={() => setSelected(r.fullName)}
                  className="size-4 accent-accent"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-mono text-[13px] font-medium">{r.fullName}</span>
                  <span className="text-xs text-muted">
                    {r.private ? "비공개" : "공개"} · {r.updatedAt.slice(5, 10).replace("-", "/")} 업데이트{r.admin ? "" : " · 관리자 권한 없음"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
        <Notice tone="info">연결하면 레포에 웹훅이 자동으로 만들어져요. 관리자(Admin) 권한이 있는 레포만 고를 수 있어요.</Notice>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={onClose} className={buttonClass("secondary")}>
          취소
        </button>
        <button type="button" onClick={connect} disabled={!selected || pending} className={buttonClass("primary")}>
          {pending ? "연결하는 중…" : "연결"}
        </button>
      </ModalFooter>
    </Modal>
  );
}

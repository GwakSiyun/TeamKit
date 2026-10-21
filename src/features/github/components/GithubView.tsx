"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClass } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { taskKey } from "@/features/tasks/constants";
import { useTransientState } from "@/hooks/useTransientState";
import { formatDateTime } from "@/lib/dates";
import { callGithubApi } from "../api";
import { eventMeta } from "../events";
import { useGithubEvents } from "../hooks";
import { RepoPickerModal } from "./RepoPickerModal";

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-1.5">
        <h2 className="text-base font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

const RULES = [
  { title: "브랜치 생성", example: "feature/TM-12-login", result: "진행 중으로 이동" },
  { title: "커밋", example: "TM-12 로그인 폼 추가", result: "진행 중으로 이동 · 활동 기록" },
  { title: "PR 머지", example: "[TM-12] 로그인 기능", result: "완료로 이동 · 머지됨 배지" },
];

export function GithubView() {
  const { project, members } = useCurrentProject();
  const { user } = useAuth();
  const events = useGithubEvents(project.id);
  const [modal, setModal] = useTransientState<"pick" | "disconnect" | null>(null);
  const isOwner = user?.uid === project.ownerId;
  const nameOf = (uid: string): string => members.find((m) => m.id === uid)?.name ?? "알 수 없음";
  const gh = project.github;

  return (
    <>
      <PageHeader title="GitHub 연동" description="카드 번호(TM-12)가 들어간 브랜치 · 커밋 · PR이 할 일에 자동으로 반영돼요" />

      {!gh ? (
        <EmptyState
          icon={<Icon name="github" size={22} />}
          title="연결된 레포가 없어요"
          description={
            isOwner ? (
              "레포를 연결하면 웹훅이 자동으로 만들어지고, 그때부터 GitHub 활동이 할 일에 반영돼요."
            ) : (
              <>레포 연결은 프로젝트를 만든 {nameOf(project.ownerId)}님이 할 수 있어요.</>
            )
          }
          actions={
            isOwner && (
              <button type="button" onClick={() => setModal("pick")} className={buttonClass("primary")}>
                <Icon name="github" size={15} />
                레포 연결
              </button>
            )
          }
        />
      ) : (
        <Section title="연결된 레포">
          <div className="flex flex-wrap items-center gap-3.5 rounded-lg border border-line p-4">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-ink text-page">
              <Icon name="github" size={22} />
            </span>
            <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
              <a
                href={`https://github.com/${gh.owner}/${gh.repo}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[15px] font-bold text-ink hover:underline"
              >
                {gh.owner}/{gh.repo}
              </a>
              <span className="text-xs text-muted">
                {nameOf(gh.connectedBy)}님이 연결 {gh.connectedAt ? `· ${formatDateTime(gh.connectedAt.toDate())}` : ""} · 웹훅 자동 등록됨
              </span>
            </div>
            {isOwner && (
              <button type="button" onClick={() => setModal("disconnect")} className={buttonClass("dangerOutline")}>
                연결 해제
              </button>
            )}
          </div>
        </Section>
      )}

      <Section title="카드 번호 규칙">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {RULES.map((r) => (
            <div key={r.title} className="flex flex-col gap-1.5 rounded-lg bg-side px-3.5 py-3">
              <span className="text-[13px] font-semibold">{r.title}</span>
              <span className="font-mono text-xs text-ink">{r.example}</span>
              <span className="text-xs text-muted">{r.result}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">상태는 앞으로만 움직여요. 완료된 카드에 커밋이 와도 되돌리지 않고, 사람이 버튼으로 바꾼 상태도 존중해요.</p>
      </Section>

      <Section title="최근 활동">
        {events.length === 0 ? (
          <p className="px-2 py-3 text-[13px] text-muted">
            {gh ? "아직 받은 GitHub 활동이 없어요. 카드 번호를 넣어 브랜치를 만들어 보세요." : "레포를 연결하면 여기에 쌓여요."}
          </p>
        ) : (
          <ul className="flex flex-col">
            {events.map((e) => (
              <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-divider px-2 py-2.5">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[13px]">
                    <b className="font-semibold">{e.author}</b> <span className="text-muted">{eventMeta(e).label}</span> ·{" "}
                    {e.url ? (
                      <a href={e.url} target="_blank" rel="noreferrer" className="font-mono text-xs hover:underline">
                        {e.title}
                      </a>
                    ) : (
                      <span className="font-mono text-xs">{e.title}</span>
                    )}
                  </span>
                  <span className="text-xs text-faint tabular-nums">{e.at ? formatDateTime(e.at.toDate()) : ""}</span>
                </span>
                <span className="flex flex-wrap justify-end gap-1">
                  {e.taskNumbers.length === 0 ? (
                    <span className="text-xs text-muted">연결할 카드 없음</span>
                  ) : (
                    e.taskNumbers.map((n) => (
                      <span key={n} className="font-mono text-xs text-muted">
                        {taskKey(n)}
                      </span>
                    ))
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-xs text-muted">
        GitHub 로그인을 안 했다면 먼저{" "}
        <Link href="/account" className="text-accent hover:text-accent-strong">
          계정 설정
        </Link>
        에서 GitHub를 연결하세요.
      </p>

      {modal === "pick" && <RepoPickerModal onClose={() => setModal(null)} />}
      {modal === "disconnect" && gh && (
        <ConfirmModal
          open
          title="레포 연결을 해제할까요?"
          confirmLabel="연결 해제"
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const r = await callGithubApi("disconnect", { projectId: project.id });
            return r.ok ? null : r.message;
          }}
        >
          <b className="text-ink">
            {gh.owner}/{gh.repo}
          </b>
          <br />
          웹훅이 지워지고 GitHub 활동이 더 이상 반영되지 않아요. 지금까지의 기록은 남아요.
        </ConfirmModal>
      )}
    </>
  );
}

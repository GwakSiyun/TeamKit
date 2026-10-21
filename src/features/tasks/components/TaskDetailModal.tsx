'use client';

import { type ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { buttonClass } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCurrentProject } from '@/features/projects/ProjectContext';
import { useTransientState } from '@/hooks/useTransientState';
import { formatDateTime, formatShort } from '@/lib/dates';
import { eulReul } from '@/lib/josa';
import { STATUS_META, taskKey } from '../constants';
import { lateDays } from '../deadline';
import { useTaskHistory } from '../hooks';
import { deleteTask } from '../services';
import type { Task } from '../types';
import { GithubBadge } from './GithubBadge';
import { StatusButtons } from './StatusButtons';

function Prop({
  icon,
  label,
  children,
}: {
  icon: IconName;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[34px] grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)] items-center gap-2">
      <span className="flex items-center gap-2 text-sm text-muted">
        <Icon name={icon} size={15} />
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {children}
      </div>
    </div>
  );
}

interface TaskDetailModalProps {
  task: Task;
  today: string;
  onClose: () => void;
  onEdit: () => void;
}

/** 노션 페이지처럼 보는 할 일 상세. 상태 변경 · 수정 · 삭제 · 변경 기록 */
export function TaskDetailModal({
  task,
  today,
  onClose,
  onEdit,
}: TaskDetailModalProps) {
  const { project, members } = useCurrentProject();
  const { user } = useAuth();
  // 규칙(canDeleteTask)과 같은 조건 — 버튼만 숨기는 게 아니라 규칙에서도 막는다
  const canDelete =
    !!user &&
    [task.createdBy, task.assigneeId, project.ownerId].includes(user.uid);
  const history = useTaskHistory(project.id, task.id);
  const [confirmDelete, setConfirmDelete] = useTransientState(false);
  const nameOf = (uid: string | null): string =>
    members.find((m) => m.id === uid)?.name ?? '알 수 없음';
  const late = lateDays(task, today);

  async function handleDelete(): Promise<string | null> {
    const result = await deleteTask(project.id, task.id);
    if (!result.ok) return result.message;
    onClose();
    return null;
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`${taskKey(task.number)} ${task.title}`}
        width={720}
        showCloseButton
      >
        <div className="flex flex-col gap-5 px-6 pt-4 pb-6">
          <div className="flex flex-col">
            <Prop icon="board" label="상태">
              <Tag tone={STATUS_META[task.status].tone}>
                {STATUS_META[task.status].label}
              </Tag>
              <StatusButtons projectId={project.id} task={task} size="normal" />
              {task.statusSource === 'github' && (
                <Tag tone="purple">GitHub로 변경됨</Tag>
              )}
            </Prop>
            <Prop icon="user" label="담당자">
              {task.assigneeId ? (
                <span className="flex items-center gap-1.5">
                  <Avatar
                    seed={task.assigneeId}
                    name={nameOf(task.assigneeId)}
                    size={20}
                  />
                  {nameOf(task.assigneeId)}
                </span>
              ) : (
                <span className="text-muted">없음</span>
              )}
            </Prop>
            <Prop icon="calendar" label="기간">
              {task.startDate || task.dueDate ? (
                <span className="tabular-nums">
                  {task.startDate ? formatShort(task.startDate) : '?'} →{' '}
                  {task.dueDate ? formatShort(task.dueDate) : '?'}
                </span>
              ) : (
                <span className="text-muted">정하지 않음</span>
              )}
              {late > 0 && <Tag tone="redSolid">{late}일 지연</Tag>}
            </Prop>
            <Prop icon="github" label="GitHub">
              {task.branch || task.github ? (
                <>
                  {task.branch && (
                    <span className="rounded bg-side px-1.5 py-0.5 font-mono text-xs">
                      {task.branch}
                    </span>
                  )}
                  <GithubBadge task={task} linked />
                  {task.github && (
                    <span className="min-w-0 truncate text-xs text-muted">
                      {task.github.prTitle}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted">
                  브랜치 · 커밋 · PR에{' '}
                  <span className="font-mono text-ink">
                    {taskKey(task.number)}
                  </span>
                  를 넣으면 자동으로 연결돼요
                </span>
              )}
            </Prop>
          </div>

          <section className="flex flex-col gap-2 border-t border-line pt-4">
            <h3 className="text-[13px] font-semibold text-sub">설명</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {task.description || (
                <span className="text-muted">설명 없음</span>
              )}
            </p>
          </section>

          <section className="flex flex-col gap-1 border-t border-line pt-4">
            <h3 className="mb-1 text-[13px] font-semibold text-sub">
              변경 기록
            </h3>
            {history.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-[90px_auto_minmax(0,1fr)] items-center gap-2 py-1 text-[13px]"
              >
                <span className="text-faint tabular-nums">
                  {h.at ? formatDateTime(h.at.toDate()) : ''}
                </span>
                <Tag tone={h.source === 'github' ? 'purple' : 'gray'}>
                  {h.source === 'github'
                    ? `GitHub · ${h.actor.replace(/^github:/, '')}`
                    : nameOf(h.actor)}
                </Tag>
                <span className="text-sub">
                  {h.from
                    ? `${STATUS_META[h.from].label} → ${STATUS_META[h.to].label}`
                    : '할 일 생성'}
                </span>
              </div>
            ))}
          </section>

          <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
            {!canDelete ? (
              <span className="text-xs text-muted">
                삭제는 만든 사람 · 담당자 · 프로젝트를 만든 사람만 할 수 있어요
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex h-7 cursor-pointer items-center rounded-md px-3 text-sm font-medium text-danger hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-accent"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              className={buttonClass('secondary')}
            >
              수정
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`${taskKey(task.number)}${eulReul(taskKey(task.number))} 삭제할까요?`}
        confirmLabel="삭제"
        onConfirm={handleDelete}
      >
        <span className="whitespace-nowrap">
          <b className="text-ink">{task.title}</b> 의 모든 기록이 사라져요.
        </span>
        <br />
        <span className="whitespace-nowrap">
          삭제된 항목은 복구할 수 없어요.
        </span>
      </ConfirmModal>
    </>
  );
}

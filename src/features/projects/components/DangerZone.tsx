'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import { buttonClass } from '@/components/ui/button';
import { useTransientState } from '@/hooks/useTransientState';
import { useCurrentProject } from '../ProjectContext';
import { DeleteProjectModal } from './DeleteProjectModal';
import { LeaveProjectModal } from './LeaveProjectModal';

/** 프로젝트 설정 맨 아래: 만든 사람은 삭제, 멤버는 나가기 */
export function DangerZone() {
  const { project } = useCurrentProject();
  const { user } = useAuth();
  const [open, setOpen] = useTransientState(false);
  const isOwner = user?.uid === project.ownerId;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-line pb-1.5 text-base font-bold text-danger">
        프로젝트 관리
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#F3C4C0] px-4 py-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">
            {isOwner ? '프로젝트 삭제' : '프로젝트 나가기'}
          </span>
          <span className="text-xs text-muted">
            {isOwner
              ? '할 일 · 회의록 · 투표까지 모두 지워지고 팀원 모두 들어올 수 없어요. 되돌릴 수 없어요.'
              : '나가면 다시 초대 코드를 받아야 들어올 수 있어요.'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={buttonClass('dangerOutline')}
        >
          {isOwner ? '프로젝트 삭제' : '나가기'}
        </button>
      </div>
      {isOwner ? (
        <DeleteProjectModal
          project={project}
          open={open}
          onClose={() => setOpen(false)}
        />
      ) : (
        <LeaveProjectModal
          project={project}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

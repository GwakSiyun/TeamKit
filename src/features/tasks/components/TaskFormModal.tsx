"use client";

import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field, SelectField, TextAreaField } from "@/components/ui/Field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { DESCRIPTION_MAX, TITLE_MAX, taskKey } from "../constants";
import { createTask, updateTask } from "../services";
import type { Task, TaskInput, TaskResult } from "../types";

const UNASSIGNED = "";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  /** 있으면 수정, 없으면 새로 만들기 */
  task?: Task | null;
  /** 새로 만들 때 미리 채울 값 (회의록 할 일 후보 등) */
  initial?: TaskInput;
  /** 새로 만들 때 기본 createTask 대신 쓸 동작 (회의록: 추가됨 표시까지 한 트랜잭션) */
  onCreate?: (input: TaskInput) => Promise<TaskResult>;
  heading?: string;
}

function initialValues(task: Task | null | undefined, myUid: string, initial?: TaskInput): TaskInput {
  if (task) {
    return { title: task.title, description: task.description, assigneeId: task.assigneeId, startDate: task.startDate, dueDate: task.dueDate };
  }
  return initial ?? { title: "", description: "", assigneeId: myUid || null, startDate: null, dueDate: null };
}

export function TaskFormModal({ open, onClose, task, initial, onCreate, heading }: TaskFormModalProps) {
  const { project, members } = useCurrentProject();
  const { user } = useAuth();
  const [values, setValues] = useState<TaskInput>(() => initialValues(task, user?.uid ?? "", initial));
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update<K extends keyof TaskInput>(key: K, value: TaskInput[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function close(): void {
    setValues(initialValues(task, user?.uid ?? "", initial));
    setErrors({});
    setServerError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const input: TaskInput = { ...values, title: values.title.trim(), description: values.description.trim() };
    const found: typeof errors = {};
    if (!input.title) found.title = "제목을 입력해주세요.";
    if (input.startDate && input.dueDate && input.startDate > input.dueDate) found.dueDate = "마감일은 시작일과 같거나 뒤여야 해요.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    setServerError(null);
    const result = task ? await updateTask(project, task, input) : onCreate ? await onCreate(input) : await createTask(project.id, input);
    setPending(false);
    if (!result.ok) {
      setServerError(result.message);
      return;
    }
    close();
  }

  const assigneeOptions = [
    ...members.map((m) => ({ value: m.id, label: m.id === user?.uid ? `${m.name} (나)` : m.name })),
    { value: UNASSIGNED, label: "담당자 없음" },
  ];

  return (
    <Modal open={open} onClose={close} title={task ? `${taskKey(task.number)} 수정` : (heading ?? "새 할 일")} width={520}>
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody>
          {serverError && <Notice tone="error">{serverError}</Notice>}
          <Field
            id="task-title"
            label="제목"
            placeholder="할 일 제목"
            maxLength={TITLE_MAX}
            autoFocus
            value={values.title}
            error={errors.title}
            onChange={(e) => update("title", e.target.value)}
          />
          <TextAreaField
            id="task-description"
            label="설명 (선택)"
            rows={3}
            maxLength={DESCRIPTION_MAX}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
          />
          <SelectField
            id="task-assignee"
            label="담당자"
            options={assigneeOptions}
            value={values.assigneeId ?? UNASSIGNED}
            onChange={(e) => update("assigneeId", e.target.value || null)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field id="task-start" label="시작일" type="date" value={values.startDate ?? ""} onChange={(e) => update("startDate", e.target.value || null)} />
            <Field
              id="task-due"
              label="마감일"
              type="date"
              value={values.dueDate ?? ""}
              error={errors.dueDate}
              onChange={(e) => update("dueDate", e.target.value || null)}
            />
          </div>
        </ModalBody>
        <ModalFooter
          hint={
            task ? undefined : (
              <>
                카드 번호 <span className="font-mono">{taskKey(project.taskCounter + 1)}</span>가 자동으로 붙어요
              </>
            )
          }
        >
          <button type="button" onClick={close} className={buttonClass("secondary")}>
            취소
          </button>
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? "저장하는 중…" : task ? "저장" : "만들기"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

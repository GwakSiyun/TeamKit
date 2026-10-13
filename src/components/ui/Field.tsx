import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/** 입력 · 여러 줄 입력 · 선택 상자가 같이 쓰는 모양 */
export function controlClass(error?: string | null, extra = ""): string {
  return `w-full rounded-md border bg-white px-2.5 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/20 ${
    error ? "border-danger" : "border-field"
  } ${extra}`;
}

interface FieldFrameProps {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

/** 라벨 + 입력 요소 + 오류/도움말 */
function FieldFrame({ id, label, error, hint, children }: FieldFrameProps) {
  const descId = `${id}-desc`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-sub">
        {label}
      </label>
      {children}
      {error ? (
        <span id={descId} className="text-xs text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={descId} className="text-xs text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
}

export function Field({ id, label, error, hint, className, ...input }: FieldProps) {
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-desc` : undefined}
        className={controlClass(error, `h-9 ${className ?? ""}`)}
        {...input}
      />
    </FieldFrame>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
}

export function TextAreaField({ id, label, error, hint, className, ...textarea }: TextAreaFieldProps) {
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-desc` : undefined}
        className={controlClass(error, `resize-y py-2 leading-relaxed ${className ?? ""}`)}
        {...textarea}
      />
    </FieldFrame>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export function SelectField({ id, label, error, hint, options, className, ...select }: SelectFieldProps) {
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint}>
      <select id={id} aria-invalid={!!error} className={controlClass(error, `h-9 ${className ?? ""}`)} {...select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

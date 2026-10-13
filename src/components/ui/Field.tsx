import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
}

export function Field({ id, label, error, hint, className, ...input }: FieldProps) {
  const describedBy = error || hint ? `${id}-desc` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-sub">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`h-9 w-full rounded-md border bg-white px-2.5 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/20 ${
          error ? "border-danger" : "border-field"
        } ${className ?? ""}`}
        {...input}
      />
      {error ? (
        <span id={describedBy} className="text-xs text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={describedBy} className="text-xs text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-faint">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

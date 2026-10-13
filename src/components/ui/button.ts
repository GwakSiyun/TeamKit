export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BASE =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  secondary: "bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-field)] hover:bg-side",
  ghost: "bg-transparent text-sub hover:bg-hover hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger-strong",
};

/** <button>·<Link> 모두에 같은 모양을 주기 위한 클래스 헬퍼 */
export function buttonClass(variant: ButtonVariant = "secondary", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`;
}

import { ACTION_KEYWORDS, DECISION_KEYWORDS } from "../extract";

/** 어떤 말을 후보로 찾는지 안내 (규칙 기반이라 그대로 보여줄 수 있다) */
export function KeywordGuide() {
  const row = (label: string, dot: string, words: readonly string[]) => (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="flex shrink-0 items-center gap-1.5 font-medium text-ink">
        <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
        {label}
      </span>
      <span className="text-sub">{words.map((w) => `“${w}”`).join(" · ")}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-side px-4 py-3 text-[13px] leading-relaxed">
      <span className="text-muted">이런 말이 들어간 문장을 후보로 찾아요. 후보를 보고 필요한 것만 보드에 추가하세요.</span>
      {row("결정사항", "bg-[#4DAB6F]", DECISION_KEYWORDS)}
      {row("할 일", "bg-accent", ACTION_KEYWORDS)}
    </div>
  );
}

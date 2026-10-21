import { addDays, weekdayOf } from "@/lib/dates";

/**
 * 할 일 후보 문장 → 카드에 넣을 값 (규칙 기반).
 * "기준씨는 금요일까지 비밀번호 찾기 담당해주시고" → 제목 "비밀번호 찾기" · 담당 손기준 · 회의한 날 ~ 금요일.
 * 화면에서 폼에 미리 채워 보여주고, 사람이 확인 · 수정한 뒤 추가한다.
 */

export interface SuggestMember {
  id: string;
  name: string;
}

export interface TaskSuggestion {
  title: string;
  assigneeId: string | null;
  startDate: string | null;
  dueDate: string | null;
}

const WEEKDAYS = "일월화수목금토";

/** 이름 뒤에 붙는 호칭 · 조사 */
const NAME_SUFFIX = "(?:씨|님|아|야)?(?:께서|은|는|이가|이는|이|가|도)?";

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 부르는 이름: 전체 이름은 그대로, 한글 세 글자면 성을 뺀 이름도 (단, 이름만 쓸 땐 "씨 · 님" 이 붙어야 인정 — "지원해주세요" 오인 방지) */
function namePatterns(name: string): RegExp[] {
  const full = name.trim();
  if (!full) return [];
  const patterns = [new RegExp(`${escapeRe(full)}${NAME_SUFFIX}\\s*`)];
  if (/^[가-힣]{3}$/.test(full)) patterns.push(new RegExp(`${escapeRe(full.slice(1))}(?:씨|님)(?:께서|은|는|이|가|도)?\\s*`));
  return patterns;
}

/** 문장에서 가장 먼저 불린 팀원 + 그 부분을 지운 문장 */
function findAssignee(text: string, members: readonly SuggestMember[]): { id: string | null; rest: string } {
  let best: { id: string; index: number; match: string } | null = null;
  for (const m of members) {
    for (const re of namePatterns(m.name)) {
      const found = re.exec(text);
      if (found && (!best || found.index < best.index)) best = { id: m.id, index: found.index, match: found[0] };
    }
  }
  if (!best) return { id: null, rest: text };
  return { id: best.id, rest: text.slice(0, best.index) + text.slice(best.index + best.match.length) };
}

const DATE_RE = /(?:(이번\s?주|다음\s?주|담주|다다음\s?주)\s*)?([월화수목금토일])요일|(오늘|내일|모레)|(\d{1,2})월\s?(\d{1,2})일|(\d{1,2})\/(\d{1,2})/g;

function weekOffset(qualifier: string | undefined): number | null {
  if (!qualifier) return null;
  const q = qualifier.replace(/\s/g, "");
  if (q === "이번주") return 0;
  if (q === "다음주" || q === "담주") return 7;
  return 14;
}

/** 회의 날짜(base) 기준으로 날짜 표현 → "YYYY-MM-DD" */
function resolveWeekday(base: string, day: string, offset: number | null): string {
  const target = (WEEKDAYS.indexOf(day) + 6) % 7; // 월=0 … 일=6
  const today = (WEEKDAYS.indexOf(weekdayOf(base)) + 6) % 7;
  if (offset === null) return addDays(base, (target - today + 7) % 7); // 다가오는 그 요일 (오늘 포함)
  return addDays(base, offset - today + target); // 그 주 월요일 기준
}

function resolveMonthDay(base: string, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  let year = Number(base.slice(0, 4));
  const iso = (y: number) => `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (iso(year) < base) year += 1; // 지난 날짜면 내년
  return iso(year);
}

/** "~부터" = 시작일, "~까지" = 마감일, 표시가 없으면 마지막 날짜를 마감일로. 날짜 부분은 문장에서 지운다 */
function findDates(text: string, base: string): { startDate: string | null; dueDate: string | null; rest: string } {
  let startDate: string | null = null;
  let dueDate: string | null = null;
  let lastPlain: string | null = null;
  let lastOffset: number | null = null;
  const cut: Array<[number, number]> = [];

  for (const m of text.matchAll(DATE_RE)) {
    const index = m.index ?? 0;
    let iso: string | null = null;
    if (m[2]) {
      const own = weekOffset(m[1]);
      // "다음 주 수요일부터 금요일까지" → 금요일도 다음 주
      const offset = own ?? lastOffset;
      if (own !== null) lastOffset = own;
      iso = resolveWeekday(base, m[2], offset);
    } else if (m[3]) {
      iso = addDays(base, m[3] === "오늘" ? 0 : m[3] === "내일" ? 1 : 2);
    } else if (m[4]) {
      iso = resolveMonthDay(base, Number(m[4]), Number(m[5]));
    } else if (m[6]) {
      iso = resolveMonthDay(base, Number(m[6]), Number(m[7]));
    }
    if (!iso) continue;

    const after = /^\s*(부터|까지|에|안에|중에|중으로|전까지)?/.exec(text.slice(index + m[0].length));
    const marker = after?.[1];
    if (marker === "부터") startDate = iso;
    else if (marker === "까지" || marker === "전까지" || marker === "안에" || marker === "중으로") dueDate = iso;
    else lastPlain = iso;
    cut.push([index, index + m[0].length + (after?.[0].length ?? 0)]);
  }

  if (!dueDate && lastPlain) dueDate = lastPlain;
  if (startDate && dueDate && startDate > dueDate) startDate = null;

  let rest = text;
  for (const [from, to] of cut.reverse()) rest = `${rest.slice(0, from)} ${rest.slice(to)}`;
  return { startDate, dueDate, rest };
}

/** 앞뒤의 접속어 · 부탁/약속 표현을 떼고 핵심 명사구만 남긴다 */
const LEADING = /^(?:그리고|그럼|그러면|그래서|그 전까지|그전까지|각자|일단|우선|먼저|저는|제가|내가|우리는?)\s+/;
const TRAILING = [
  "하는 걸로 할게요",
  "하는 걸로 하죠",
  "하는 걸로",
  "걸로 할게요",
  "걸로",
  "끝내주시고",
  "끝내주세요",
  "끝내 주세요",
  "해주시고",
  "해 주시고",
  "해주세요",
  "해 주세요",
  "해주시구요",
  "맡아주시고",
  "맡아주세요",
  "맡아 주세요",
  "부탁드려요",
  "부탁해요",
  "부탁합니다",
  "주시고",
  "주세요",
  "해줘",
  "할게요",
  "하겠습니다",
  "해야 해요",
  "해야 돼요",
  "해야 합니다",
  "해야 해",
  "해야 돼",
  "해야",
  "담당",
  "맡아",
  "먼저",
  "을",
  "를",
] as const;

function cleanTitle(text: string): string {
  let t = text
    .replace(/[.!?。,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (let changed = true; changed;) {
    changed = false;
    const lead = t.replace(LEADING, "");
    if (lead !== t) {
      t = lead.trim();
      changed = true;
    }
    for (const ending of TRAILING) {
      if (t.endsWith(ending) && t.length > ending.length) {
        t = t.slice(0, -ending.length).trim();
        changed = true;
        break;
      }
    }
  }
  // "로그인하고 회원가입" → "로그인 · 회원가입", 주제 조사로 시작하는 꼬리 정리
  return t
    .replace(/(\S)하고\s+/g, "$1 · ")
    .replace(/^(?:은|는|이|가)\s+/, "")
    .replace(/(\S{2,})(?:은|는)$/, "$1") // 날짜를 뺀 뒤 남은 주제 조사 ("회원가입 화면은" → "회원가입 화면")
    .trim();
}

export function suggestTask(text: string, members: readonly SuggestMember[], baseISO: string): TaskSuggestion {
  const assignee = findAssignee(text, members);
  const dates = findDates(assignee.rest, baseISO);
  const title = cleanTitle(dates.rest);
  return {
    title: title.length >= 2 ? title.slice(0, 100) : text.slice(0, 100),
    assigneeId: assignee.id,
    // "~부터" 가 없으면 회의한 날부터 시작 (마감일이 회의 날보다 앞이면 비워둔다)
    startDate: dates.startDate ?? (!dates.dueDate || dates.dueDate >= baseISO ? baseISO : null),
    dueDate: dates.dueDate,
  };
}

export interface ScheduleSuggestion {
  date: string;
  /** 시작 시각 (0~23). 시간을 말하지 않았으면 null */
  hour: number | null;
}

const HOUR_RE = /(오전|아침|오후|낮|저녁|밤)?\s*(\d{1,2})\s*시/;

/** "오후 3시" · "저녁 7시" · "10시" → 0~23. 오전/오후 없이 1~8시면 오후로 본다 (회의를 새벽에 하진 않으니까) */
function findHour(text: string): number | null {
  const m = HOUR_RE.exec(text);
  if (!m) return null;
  let hour = Number(m[2]);
  if (hour < 0 || hour > 24) return null;
  const part = m[1];
  if ((part === "오후" || part === "저녁" || part === "밤") && hour < 12) hour += 12;
  else if (part === "낮" && hour < 6) hour += 12;
  else if (!part && hour >= 1 && hour <= 8) hour += 12;
  return hour === 24 ? 0 : hour;
}

/**
 * 결정사항 문장 → 다음 회의 일정. "회의" 와 날짜가 같이 있어야 한다.
 * "다음주 화요일 10시에 회의 진행할게요" → 회의 날 기준 다음 주 화요일 10시.
 */
export function suggestSchedule(text: string, baseISO: string): ScheduleSuggestion | null {
  if (!text.includes("회의")) return null;
  const dates = findDates(text, baseISO);
  let date = dates.startDate ?? dates.dueDate;
  if (!date) return null;
  // 목요일 회의에서 "다음 회의는 목요일" → 오늘이 아니라 다음 주 목요일
  if (date === baseISO && !text.includes("오늘")) date = addDays(baseISO, 7);
  return { date, hour: findHour(text) };
}

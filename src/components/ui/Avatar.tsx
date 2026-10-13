// 디자인 캔버스의 태그 색 (배경, 글자)
const PALETTE: ReadonlyArray<readonly [string, string]> = [
  ["#FADEC9", "#49290E"],
  ["#D3E5EF", "#183347"],
  ["#E8DEEE", "#412454"],
  ["#DBEDDB", "#1C3829"],
  ["#FDECC8", "#402C1B"],
  ["#FFE2DD", "#5D1715"],
];

/** 같은 사람은 항상 같은 색 (uid 해시) */
function colorFor(seed: string): readonly [string, string] {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  /** 색을 고르는 기준 (uid) */
  seed: string;
  name: string;
  size?: number;
}

export function Avatar({ seed, name, size = 20 }: AvatarProps) {
  const [bg, fg] = colorFor(seed);
  return (
    <span
      title={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.5) }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** 겹쳐 보이는 아바타 묶음 */
export function AvatarStack({ people, size = 24, max = 5 }: { people: ReadonlyArray<{ id: string; name: string }>; size?: number; max?: number }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((p, i) => (
        <span key={p.id} className="inline-flex rounded-full shadow-[0_0_0_2px_#fff]" style={{ marginLeft: i === 0 ? 0 : -6 }}>
          <Avatar seed={p.id} name={p.name} size={size} />
        </span>
      ))}
      {rest > 0 && <span className="ml-1.5 text-xs text-muted">+{rest}</span>}
    </span>
  );
}

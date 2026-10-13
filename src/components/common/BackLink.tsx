import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

/**
 * 상위 화면으로 돌아가는 ← 버튼. 브라우저 뒤로가기(history.back) 대신 정해진 주소로 보낸다
 * → 링크로 바로 들어온 경우에도 항상 같은 곳으로 간다. label 은 화면 낭독기·툴팁용.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} title={label} className={buttonClass("ghost", "-ml-2 size-8 px-0 text-sub")}>
      <Icon name="arrowLeft" size={18} />
    </Link>
  );
}

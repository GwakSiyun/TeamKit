import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

/**
 * 상위 화면으로 돌아가는 링크. 브라우저 뒤로가기(history.back) 대신 정해진 주소로 보낸다
 * → 링크로 바로 들어온 경우에도 항상 같은 곳으로 간다.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={buttonClass("ghost", "-ml-2.5 w-fit gap-1 px-2 text-muted")}>
      <Icon name="left" size={16} />
      {label}
    </Link>
  );
}

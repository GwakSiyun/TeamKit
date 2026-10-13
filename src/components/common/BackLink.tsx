import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';

/**
 * 상위 화면으로 돌아가는 "← 뒤로가기". 브라우저 기록(history.back) 대신 정해진 주소로 보낸다
 * → 링크로 바로 들어온 경우에도 항상 같은 곳으로 간다. label 은 어디로 가는지 알려주는 툴팁·화면 낭독기용.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={buttonClass('ghost', '-ml-2 w-fit gap-1 px-2 text-sub')}
    >
      <Icon name="arrowLeft" size={16} />
      뒤로가기
    </Link>
  );
}

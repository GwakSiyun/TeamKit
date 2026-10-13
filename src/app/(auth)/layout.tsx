import type { ReactNode } from "react";
import { BrandMark } from "@/components/common/BrandMark";
import { AuthGate } from "@/features/auth/components/AuthGate";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex h-14 items-center px-6">
        <BrandMark />
      </header>
      <main className="flex flex-1 justify-center px-4 pt-[72px] pb-12">
        <div className="flex w-full max-w-[340px] flex-col gap-4">
          <AuthGate require="signed-out">{children}</AuthGate>
        </div>
      </main>
    </div>
  );
}

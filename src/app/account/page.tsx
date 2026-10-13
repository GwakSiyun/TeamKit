import type { Metadata } from "next";
import { PlainLayout } from "@/components/layout/PlainLayout";
import { AccountView } from "@/features/auth/components/AccountView";
import { AuthGate } from "@/features/auth/components/AuthGate";

export const metadata: Metadata = { title: "계정 설정" };

export default function AccountPage() {
  return (
    <PlainLayout back={{ href: "/projects", label: "내 프로젝트로 돌아가기" }}>
      <AuthGate require="signed-in">
        <AccountView />
      </AuthGate>
    </PlainLayout>
  );
}

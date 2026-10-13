import { redirect } from "next/navigation";

// 로그인 안 했으면 /projects 의 AuthGate 가 /login 으로 보낸다.
export default function Home() {
  redirect("/projects");
}

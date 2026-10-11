import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthCard from "@/components/AuthCard";
import LoginForm from "@/components/LoginForm";
import { getSession } from "@/lib/session";
import { homeFor } from "@/lib/rules";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));

  return (
    <AuthCard
      title="🔐 QuizHero Login"
      subtitle="Welcome back! Log in to continue."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="link link-primary font-semibold">
            Sign up here
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

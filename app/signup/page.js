import Link from "next/link";
import { redirect } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import SignUpForm from "@/components/SignUpForm";
import { getSession } from "@/lib/session";
import { homeFor } from "@/lib/rules";

export const metadata = { title: "Sign up" };

export default async function SignUpPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));

  return (
    <AuthCard
      title="Create your account"
      subtitle="Students sign up for free. Instructors need an invite code."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="link link-primary font-semibold">
            Login here
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}

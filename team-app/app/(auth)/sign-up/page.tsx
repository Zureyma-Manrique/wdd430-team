import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { textLinkClasses } from "@/components/ui/styles";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Sign up",
  description: "Create a free Paws & Paths account as a dog owner or as a dog walker.",
  path: "/sign-up",
  private: true,
});

export default async function SignUpPage() {
  if (await getSession()) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h1>
        <p className="text-muted">Join as a dog owner or as a walker.</p>
      </header>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <SignUpForm />
      </div>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className={textLinkClasses}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

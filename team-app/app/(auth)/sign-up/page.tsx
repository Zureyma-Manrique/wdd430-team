import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { textLinkClasses } from "@/components/ui/styles";
import { googleSignInEnabled } from "@/lib/auth/google";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Sign up",
  description: "Create a free Paws & Paths account as a dog owner or as a dog walker.",
  path: "/sign-up",
});

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const { error } = await searchParams;
  if (await getSession()) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h1>
        <p className="text-muted">Join as a dog owner or as a walker.</p>
      </header>

      {error === "google-role" ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          We don&apos;t have an account for that Google address yet. Choose Owner or Walker below, then continue with
          Google.
        </p>
      ) : null}

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <SignUpForm googleEnabled={googleSignInEnabled()} />
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

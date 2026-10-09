import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { textLinkClasses } from "@/components/ui/styles";
import { getSession } from "@/lib/auth/session";
import { callbackUrlSchema } from "@/lib/validation";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to Paws & Paths to manage your dogs, book walks, or answer walk requests.",
  path: "/sign-in",
});

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { callbackUrl: rawCallbackUrl } = await searchParams;
  // Only same-origin paths survive; anything else falls back to /dashboard (no open redirects).
  const callbackUrl = callbackUrlSchema.parse(rawCallbackUrl);

  if (await getSession()) {
    redirect(callbackUrl);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-muted">Sign in to manage your dogs and walks.</p>
      </header>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <SignInForm callbackUrl={callbackUrl} />
      </div>

      <p className="text-center text-sm text-muted">
        New to Paws &amp; Paths?{" "}
        <Link href="/sign-up" className={textLinkClasses}>
          Create an account
        </Link>
      </p>
    </div>
  );
}

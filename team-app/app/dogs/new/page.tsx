import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DogForm } from "@/components/dogs/dog-form";
import { getSession } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Add a dog",
  description: "Add a dog to your account with breed, size and care notes.",
  path: "/dogs/new",
  private: true,
});

/** Story B1 (FR-011): add a dog. */
export default async function NewDogPage() {
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/dogs/new")}`);
  }
  if (session.role !== "OWNER") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">My dogs</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Add a dog</h1>
        <p className="text-muted">Tell walkers who they&apos;ll be walking.</p>
      </header>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <DogForm />
      </div>
    </div>
  );
}

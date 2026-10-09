import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArchiveDogButton } from "@/components/dogs/archive-dog-button";
import { DogForm } from "@/components/dogs/dog-form";
import { getSession } from "@/lib/auth/session";
import { getDogForOwner } from "@/lib/data/dogs";
import { pageMetadata } from "@/lib/metadata";
import { idParamsSchema } from "@/lib/validation";

export const metadata: Metadata = pageMetadata({
  title: "Edit dog",
  description: "Update your dog's details or remove them from your account.",
  path: "/dogs",
  private: true,
});

/** Stories B1 and B2 (FR-012, FR-013): edit or remove one of my dogs. */
export default async function EditDogPage({ params }: PageProps<"/dogs/[id]">) {
  const parsed = idParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/dogs/${parsed.data.id}`)}`);
  }
  if (session.role !== "OWNER") {
    redirect("/dashboard");
  }

  // Another owner's dog and a missing dog are both 404 (FR-004).
  const dog = await getDogForOwner(session.profileId, parsed.data.id);
  if (!dog) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">My dogs</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{dog.name}</h1>
      </header>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <DogForm dog={dog} />
      </div>

      <section aria-labelledby="remove-heading" className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
        <h2 id="remove-heading" className="text-xl font-semibold text-foreground">
          Remove this dog
        </h2>
        <p className="text-sm text-muted">
          Removing {dog.name} hides them from your account. Past walks and reviews keep their record.
        </p>
        <ArchiveDogButton dogId={dog.id} dogName={dog.name} />
      </section>
    </div>
  );
}

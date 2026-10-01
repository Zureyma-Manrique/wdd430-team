import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OwnerProfileForm } from "@/components/profile/owner-profile-form";
import { WalkerProfileForm } from "@/components/profile/walker-profile-form";
import { textLinkClasses } from "@/components/ui/styles";
import { getSession } from "@/lib/auth/session";
import { formatPhone } from "@/lib/format";
import { getOwnOwnerProfile } from "@/lib/data/owners";
import { getOwnWalkerProfile, getWalkerById } from "@/lib/data/walkers";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Your profile",
  description: "Update your contact details, or your walker bio, service area, and hourly rate.",
  path: "/profile",
  private: true,
});

export default async function ProfilePage() {
  // Deny by default: `proxy.ts` also guards /profile, but pages never rely on it alone.
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  if (session.role === "OWNER") {
    const owner = await getOwnOwnerProfile(session.profileId);
    if (!owner) {
      redirect("/dashboard");
    }
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Owner profile</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{session.name}</h1>
          <p className="text-muted">Keep your contact details current so walkers can reach you.</p>
        </header>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <OwnerProfileForm
            owner={{
              name: session.name,
              phone: owner.phone === null ? null : formatPhone(owner.phone),
              postalCode: owner.postalCode,
            }}
          />
        </div>
      </div>
    );
  }

  const walker = await getOwnWalkerProfile(session.profileId);
  if (!walker) {
    redirect("/dashboard");
  }
  // Searchable = active with a rate and service area; only then is the public page reachable.
  const isPublic = (await getWalkerById(walker.id)) !== null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Walker profile</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{walker.displayName}</h1>
        <p className="text-muted">
          {isPublic
            ? "Your profile is complete and visible to owners in search."
            : "Owners can't find you yet. Add a service area and an hourly rate, and keep “Accepting new walks” on."}
        </p>
        {isPublic ? (
          <Link href={`/walkers/${walker.id}`} className={`self-start ${textLinkClasses}`}>
            View your public profile
          </Link>
        ) : null}
      </header>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <WalkerProfileForm walker={walker} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WalkerProfileForm } from "@/components/profile/walker-profile-form";
import { textLinkClasses } from "@/components/ui/styles";
import { getSession } from "@/lib/auth/session";
import { getOwnWalkerProfile, getWalkerById } from "@/lib/data/walkers";

export const metadata: Metadata = {
  title: "Your profile",
};

export default async function ProfilePage() {
  // Deny by default: `proxy.ts` also guards /profile, but pages never rely on it alone.
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  if (session.role !== "WALKER") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Your profile</h1>
        <p className="text-muted">
          Owner profile editing (phone and neighborhood) arrives with the database. For now, your
          account name is {session.name}.
        </p>
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

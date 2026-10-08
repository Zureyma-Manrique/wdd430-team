import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";

// Its own title, so the 404 page doesn't look like the home page in tabs and history. Next adds
// `noindex` to not-found pages by itself.
export const metadata: Metadata = {
  title: "Page not found",
  description: "This page doesn't exist or has moved. Head back to the home page or find a walker.",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <p className="text-5xl" aria-hidden="true">
        🐾
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Page not found</h1>
      <p className="text-muted">This trail doesn&apos;t lead anywhere. The page may have moved or never existed.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/walkers" variant="secondary">
          Find a walker
        </ButtonLink>
      </div>
    </div>
  );
}

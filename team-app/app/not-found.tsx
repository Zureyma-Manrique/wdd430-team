import { ButtonLink } from "@/components/ui/button";

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

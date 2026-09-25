"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { z } from "zod";
import { Button, ButtonLink } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form-field";
import { MIN_RATING_OPTIONS, walkerSearchParamsSchema, type WalkerSort } from "@/lib/validation/walker";

export interface FilterBarValues {
  postalCode: string;
  minRating: string;
  sort: WalkerSort;
}

interface FilterBarProps {
  /** Current filters, already validated on the server. Give the component a `key` so it resets on navigation. */
  initial: FilterBarValues;
}

/**
 * Walker search controls. Filters live in the URL (shareable, back-button friendly); the
 * server page validates them again, so this component's check is only for fast feedback.
 */
export function FilterBar({ initial }: FilterBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [postalCodeError, setPostalCodeError] = useState<string | undefined>();

  function applyFilters(form: HTMLFormElement) {
    const data = new FormData(form);
    const field = (name: string) => {
      const value = data.get(name);
      return typeof value === "string" ? value : "";
    };

    const parsed = walkerSearchParamsSchema.safeParse({
      postalCode: field("postalCode"),
      minRating: field("minRating"),
      sort: field("sort"),
    });
    if (!parsed.success) {
      setPostalCodeError(z.flattenError(parsed.error).fieldErrors.postalCode?.[0] ?? "Check your filters");
      return;
    }
    setPostalCodeError(undefined);

    const params = new URLSearchParams();
    if (parsed.data.postalCode) params.set("postalCode", parsed.data.postalCode);
    if (parsed.data.minRating !== undefined) params.set("minRating", String(parsed.data.minRating));
    if (parsed.data.sort !== "rating") params.set("sort", parsed.data.sort);

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/walkers?${query}` : "/walkers");
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters(event.currentTarget);
  }

  return (
    <form
      role="search"
      aria-label="Filter walkers"
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-start"
    >
      <TextField
        id="filter-postal-code"
        name="postalCode"
        label="Postal code"
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="e.g. 84604"
        maxLength={5}
        defaultValue={initial.postalCode}
        error={postalCodeError}
      />

      <SelectField
        id="filter-min-rating"
        name="minRating"
        label="Minimum rating"
        defaultValue={initial.minRating}
      >
        <option value="">Any rating</option>
        {MIN_RATING_OPTIONS.map((rating) => (
          <option key={rating} value={String(rating)}>
            {rating}+ stars
          </option>
        ))}
      </SelectField>

      <SelectField
        id="filter-sort"
        name="sort"
        label="Sort by"
        defaultValue={initial.sort}
      >
        <option value="rating">Rating: high to low</option>
        <option value="price">Price: low to high</option>
      </SelectField>

      <div className="flex gap-2 sm:col-span-2 lg:col-span-1 lg:mt-7">
        <Button type="submit" disabled={isPending} className="flex-1 lg:flex-none">
          {isPending ? "Searching…" : "Search"}
        </Button>
        <ButtonLink href="/walkers" variant="secondary">
          Reset
        </ButtonLink>
      </div>
    </form>
  );
}

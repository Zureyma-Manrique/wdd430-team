/**
 * Core domain types for Paws & Paths (spec §4 "Key Entities").
 *
 * Enum-like unions are derived from `as const` tuples so the same source of truth feeds
 * both TypeScript and the Zod schemas in `lib/validation/`.
 *
 * Dates are ISO-8601 UTC strings so these objects serialize safely across the
 * server → client component boundary.
 */

export const USER_ROLES = ["OWNER", "WALKER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DOG_SIZES = ["SMALL", "MEDIUM", "LARGE", "XLARGE"] as const;
export type DogSize = (typeof DOG_SIZES)[number];

export const WALK_BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "DECLINED",
  "CANCELLED",
  "IN_PROGRESS",
  "COMPLETED",
  "EXPIRED",
] as const;
export type WalkBookingStatus = (typeof WALK_BOOKING_STATUSES)[number];

export const WALK_DURATIONS_MINUTES = [30, 45, 60] as const;
export type WalkDurationMinutes = (typeof WALK_DURATIONS_MINUTES)[number];

export const WALK_STATUS_ACTIONS = ["accept", "decline", "cancel", "start", "complete"] as const;
export type WalkStatusAction = (typeof WALK_STATUS_ACTIONS)[number];

/** ISO-8601 timestamp in UTC, e.g. `2026-09-24T15:00:00.000Z`. */
export type IsoDateTime = string;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface PetOwner {
  id: string;
  userId: string;
  phone: string | null;
  postalCode: string | null;
}

export interface Walker {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  serviceAreaPostalCodes: string[];
  /** Whole US dollars, $5–$200 (FR-040). */
  hourlyRate: number | null;
  photoUrl: string | null;
  isActive: boolean;
}

/** Public walker view with computed rating data (FR-031, FR-041). */
export interface WalkerSummary extends Walker {
  /** `null` when the walker has no reviews yet. */
  averageRating: number | null;
  reviewCount: number;
}

export interface DogProfile {
  id: string;
  ownerId: string;
  name: string;
  breed: string | null;
  size: DogSize;
  /** Calendar date, `YYYY-MM-DD`. */
  birthDate: string | null;
  weightKg: number | null;
  notes: string | null;
  photoUrl: string | null;
  archivedAt: IsoDateTime | null;
}

export interface WalkCancellation {
  cancelledByUserId: string;
  reason: string | null;
  cancelledAt: IsoDateTime;
}

export interface WalkBooking {
  id: string;
  dogId: string;
  ownerId: string;
  walkerId: string;
  startAt: IsoDateTime;
  durationMinutes: WalkDurationMinutes;
  status: WalkBookingStatus;
  pickupNotes: string | null;
  actualStartAt: IsoDateTime | null;
  actualEndAt: IsoDateTime | null;
  sessionNotes: string | null;
  cancellation: WalkCancellation | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface WalkerReview {
  id: string;
  walkId: string;
  walkerId: string;
  authorId: string;
  /** Whole number, 1–5. */
  rating: number;
  comment: string | null;
  walkerReply: string | null;
  createdAt: IsoDateTime;
  editedAt: IsoDateTime | null;
}

/** Review as shown publicly on a walker profile (FR-034, story D2). */
export interface PublicWalkerReview extends WalkerReview {
  authorFirstName: string;
  dogName: string;
}

/** Minimal session shape exposed to the app. Never includes secrets or password hashes. */
export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
  /** PetOwner.id or Walker.id, depending on `role`. */
  profileId: string;
}

/** Standard API error body (spec §6). */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

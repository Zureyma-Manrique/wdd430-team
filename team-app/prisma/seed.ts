/*
 * Demo data for local development and the deployed demo. Run with `npm run db:seed`.
 *
 *   npm run db:seed                    creates anything that's missing (safe to re-run)
 *   npx tsx prisma/seed.ts --if-empty  does nothing unless the database has no users yet
 *                                      (the deploy build uses this, so real data is never touched)
 *
 * Demo sign-ins (password `paws-demo-2026`): jordan@example.com (owner), sam@example.com (walker).
 * The other seeded people exist so search, ratings and reviews have something to show; their
 * passwords are random and unknown, so only the two demo accounts can sign in.
 */
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { PrismaClient, type DogSize } from "../generated/prisma/client";

config({ path: [".env.local", ".env"], quiet: true });

const DEMO_PASSWORD = "paws-demo-2026";
const HASH_ROUNDS = 12; // keep in sync with PASSWORD_HASH_ROUNDS in lib/auth/auth.ts

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set (see README).");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

interface SeedWalker {
  id: string;
  userId: string;
  email: string;
  name: string;
  bio: string | null;
  postalCodes: string[];
  hourlyRate: number | null;
  isActive: boolean;
}

const walkers: SeedWalker[] = [
  {
    id: "w_sam01",
    userId: "u_sam",
    email: "sam@example.com",
    name: "Sam Rivera",
    bio: "Former vet tech who loves high-energy dogs. Comfortable with reactive pups and leash training.",
    postalCodes: ["84604", "84601"],
    hourlyRate: 22,
    isActive: true,
  },
  {
    id: "w_mia02",
    userId: "u_mia",
    email: "mia@example.com",
    name: "Mia Chen",
    bio: "BYU student with flexible afternoons. Small and senior dogs are my favorite.",
    postalCodes: ["84604", "84602"],
    hourlyRate: 15,
    isActive: true,
  },
  {
    id: "w_theo03",
    userId: "u_theo",
    email: "theo@example.com",
    name: "Theo Walker",
    bio: "Yes, that's really my last name. Trail runner offering long, adventurous walks.",
    postalCodes: ["84601", "84606"],
    hourlyRate: 28,
    isActive: true,
  },
  {
    id: "w_ana04",
    userId: "u_ana",
    email: "ana@example.com",
    name: "Ana Lopez",
    bio: "Full-time pet sitter in downtown Salt Lake City. First aid certified.",
    postalCodes: ["84101", "84111"],
    hourlyRate: 25,
    isActive: true,
  },
  {
    id: "w_new05",
    userId: "u_new",
    email: "riley@example.com",
    name: "Riley Park",
    bio: "Just getting started. Happy to walk dogs of every size.",
    postalCodes: ["84604"],
    hourlyRate: 12,
    isActive: true,
  },
  {
    // Incomplete profile (no rate): must never appear in search (story A3, scenario 2).
    id: "w_inc06",
    userId: "u_inc",
    email: "casey@example.com",
    name: "Casey Incomplete",
    bio: null,
    postalCodes: ["84604"],
    hourlyRate: null,
    isActive: true,
  },
  {
    // Deactivated walker: hidden from search and public profile.
    id: "w_off07",
    userId: "u_off",
    email: "morgan@example.com",
    name: "Morgan Away",
    bio: "On a break.",
    postalCodes: ["84604"],
    hourlyRate: 20,
    isActive: false,
  },
];

interface SeedDog {
  id: string;
  name: string;
  breed: string | null;
  size: DogSize;
  birthDate: string | null;
  weightKg: number | null;
  notes: string | null;
}

interface SeedOwner {
  id: string;
  userId: string;
  email: string;
  name: string;
  phone: string | null;
  postalCode: string | null;
  dogs: SeedDog[];
}

const owners: SeedOwner[] = [
  {
    id: "o_demo01",
    userId: "u_demo_owner",
    email: "jordan@example.com",
    name: "Jordan",
    phone: "8015550142",
    postalCode: "84604",
    dogs: [
      {
        id: "d_biscuit",
        name: "Biscuit",
        breed: "Beagle",
        size: "MEDIUM",
        birthDate: "2021-04-12",
        weightKg: 11,
        notes: "Pulls on leash; afraid of bikes.",
      },
      {
        id: "d_luna",
        name: "Luna",
        breed: "Border Collie mix",
        size: "LARGE",
        birthDate: "2019-11-02",
        weightKg: 21,
        notes: null,
      },
    ],
  },
  {
    // Owns Otis, so ownership checks (FR-004) have someone else's dog to protect.
    id: "o_kim",
    userId: "u_kim",
    email: "kim@example.com",
    name: "Kim",
    phone: null,
    postalCode: null,
    dogs: [{ id: "d_otis", name: "Otis", breed: "Pug", size: "SMALL", birthDate: null, weightKg: null, notes: null }],
  },
  {
    id: "o_lee",
    userId: "u_lee",
    email: "lee@example.com",
    name: "Lee",
    phone: null,
    postalCode: "84604",
    dogs: [{ id: "d_pepper", name: "Pepper", breed: "Terrier mix", size: "SMALL", birthDate: null, weightKg: 7, notes: null }],
  },
  {
    id: "o_pat",
    userId: "u_pat",
    email: "pat@example.com",
    name: "Pat",
    phone: null,
    postalCode: "84602",
    dogs: [{ id: "d_noodle", name: "Noodle", breed: "Dachshund", size: "SMALL", birthDate: null, weightKg: 8, notes: "13 years old." }],
  },
  {
    id: "o_sky",
    userId: "u_sky",
    email: "sky@example.com",
    name: "Sky",
    phone: null,
    postalCode: "84601",
    dogs: [{ id: "d_ranger", name: "Ranger", breed: "Labrador", size: "LARGE", birthDate: null, weightKg: 30, notes: null }],
  },
  {
    id: "o_bo",
    userId: "u_bo",
    email: "bo@example.com",
    name: "Bo",
    phone: null,
    postalCode: "84101",
    dogs: [{ id: "d_mochi", name: "Mochi", breed: "Shiba Inu", size: "MEDIUM", birthDate: null, weightKg: 10, notes: null }],
  },
];

interface SeedReview {
  id: string;
  walkId: string;
  walkerId: string;
  ownerId: string;
  authorId: string;
  dogId: string;
  rating: number;
  comment: string | null;
  walkerReply: string | null;
  createdAt: string;
  editedAt: string | null;
}

// Each review belongs to a COMPLETED walk (FR-030), so every row below creates that walk too.
const reviews: SeedReview[] = [
  {
    id: "r_01",
    walkId: "wk_01",
    walkerId: "w_sam01",
    ownerId: "o_demo01",
    authorId: "u_demo_owner",
    dogId: "d_biscuit",
    rating: 5,
    comment: "Great with my anxious pup. Sent a quick note after every walk.",
    walkerReply: "Biscuit is a joy. See you next week!",
    createdAt: "2026-09-10T17:00:00.000Z",
    editedAt: null,
  },
  {
    id: "r_02",
    walkId: "wk_02",
    walkerId: "w_sam01",
    ownerId: "o_lee",
    authorId: "u_lee",
    dogId: "d_pepper",
    rating: 4,
    comment: "Always on time. Pepper came back happy and tired.",
    walkerReply: null,
    createdAt: "2026-08-28T15:30:00.000Z",
    editedAt: null,
  },
  {
    id: "r_03",
    walkId: "wk_03",
    walkerId: "w_sam01",
    ownerId: "o_kim",
    authorId: "u_kim",
    dogId: "d_otis",
    rating: 5,
    comment: null,
    walkerReply: null,
    createdAt: "2026-08-15T12:00:00.000Z",
    editedAt: null,
  },
  {
    id: "r_04",
    walkId: "wk_04",
    walkerId: "w_mia02",
    ownerId: "o_pat",
    authorId: "u_pat",
    dogId: "d_noodle",
    rating: 4,
    comment: "Very gentle with our 13-year-old dachshund.",
    walkerReply: null,
    createdAt: "2026-09-02T19:00:00.000Z",
    editedAt: "2026-09-03T08:00:00.000Z",
  },
  {
    id: "r_05",
    walkId: "wk_05",
    walkerId: "w_theo03",
    ownerId: "o_sky",
    authorId: "u_sky",
    dogId: "d_ranger",
    rating: 3,
    comment: "Long walk as promised, but arrived 15 minutes late.",
    walkerReply: "Sorry about that. Traffic on University Ave. It won't happen again.",
    createdAt: "2026-09-12T16:00:00.000Z",
    editedAt: null,
  },
  {
    id: "r_06",
    walkId: "wk_06",
    walkerId: "w_ana04",
    ownerId: "o_bo",
    authorId: "u_bo",
    dogId: "d_mochi",
    rating: 5,
    comment: "Ana is the best. Mochi pulls toward her door now.",
    walkerReply: null,
    createdAt: "2026-09-18T14:00:00.000Z",
    editedAt: null,
  },
];

const HOUR_MS = 60 * 60 * 1000;

async function main() {
  if (process.argv.includes("--if-empty") && (await prisma.user.count()) > 0) {
    console.log("Database already has users; skipping the seed.");
    return;
  }

  const demoHash = await bcrypt.hash(DEMO_PASSWORD, HASH_ROUNDS);
  // A real bcrypt hash of a random value nobody knows, so these accounts can't be signed in to.
  const lockedHash = await bcrypt.hash(randomBytes(24).toString("base64"), HASH_ROUNDS);
  const isDemoAccount = (email: string) => email === "jordan@example.com" || email === "sam@example.com";
  const passwordFor = (email: string) => (isDemoAccount(email) ? demoHash : lockedHash);

  for (const walker of walkers) {
    await prisma.user.upsert({
      where: { id: walker.userId },
      update: {},
      create: {
        id: walker.userId,
        email: walker.email,
        name: walker.name,
        role: "WALKER",
        passwordHash: passwordFor(walker.email),
        walker: {
          create: {
            id: walker.id,
            displayName: walker.name,
            bio: walker.bio,
            serviceAreaPostalCodes: walker.postalCodes,
            hourlyRate: walker.hourlyRate,
            isActive: walker.isActive,
          },
        },
      },
    });
  }

  for (const owner of owners) {
    await prisma.user.upsert({
      where: { id: owner.userId },
      update: {},
      create: {
        id: owner.userId,
        email: owner.email,
        name: owner.name,
        role: "OWNER",
        passwordHash: passwordFor(owner.email),
        owner: {
          create: {
            id: owner.id,
            phone: owner.phone,
            postalCode: owner.postalCode,
            dogs: {
              create: owner.dogs.map((dog) => ({
                id: dog.id,
                name: dog.name,
                breed: dog.breed,
                size: dog.size,
                birthDate: dog.birthDate ? new Date(`${dog.birthDate}T00:00:00.000Z`) : null,
                weightKg: dog.weightKg,
                notes: dog.notes,
              })),
            },
          },
        },
      },
    });
  }

  for (const review of reviews) {
    const reviewedAt = new Date(review.createdAt);
    await prisma.walkBooking.upsert({
      where: { id: review.walkId },
      update: {},
      create: {
        id: review.walkId,
        dogId: review.dogId,
        ownerId: review.ownerId,
        walkerId: review.walkerId,
        startAt: new Date(reviewedAt.getTime() - 3 * HOUR_MS),
        durationMinutes: 60,
        status: "COMPLETED",
        actualStartAt: new Date(reviewedAt.getTime() - 3 * HOUR_MS),
        actualEndAt: new Date(reviewedAt.getTime() - 2 * HOUR_MS),
      },
    });
    await prisma.walkerReview.upsert({
      where: { id: review.id },
      update: {},
      create: {
        id: review.id,
        walkId: review.walkId,
        walkerId: review.walkerId,
        authorId: review.authorId,
        rating: review.rating,
        comment: review.comment,
        walkerReply: review.walkerReply,
        createdAt: reviewedAt,
        editedAt: review.editedAt ? new Date(review.editedAt) : null,
      },
    });
  }

  console.log(
    `Seeded ${walkers.length} walkers, ${owners.length} owners, ${owners.flatMap((o) => o.dogs).length} dogs and ${reviews.length} reviews.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

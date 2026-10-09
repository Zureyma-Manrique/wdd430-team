-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'WALKER');

-- CreateEnum
CREATE TYPE "DogSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'XLARGE');

-- CreateEnum
CREATE TYPE "WalkBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetOwner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "postalCode" TEXT,

    CONSTRAINT "PetOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Walker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "serviceAreaPostalCodes" TEXT[],
    "hourlyRate" INTEGER,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Walker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dog" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "size" "DogSize" NOT NULL,
    "birthDate" DATE,
    "weightKg" DOUBLE PRECISION,
    "notes" TEXT,
    "photoUrl" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Dog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkBooking" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "walkerId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "WalkBookingStatus" NOT NULL DEFAULT 'PENDING',
    "pickupNotes" TEXT,
    "actualStartAt" TIMESTAMPTZ(3),
    "actualEndAt" TIMESTAMPTZ(3),
    "sessionNotes" TEXT,
    "cancelledByUserId" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WalkBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkerReview" (
    "id" TEXT NOT NULL,
    "walkId" TEXT NOT NULL,
    "walkerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "walkerReply" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMPTZ(3),

    CONSTRAINT "WalkerReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PetOwner_userId_key" ON "PetOwner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Walker_userId_key" ON "Walker"("userId");

-- CreateIndex
CREATE INDEX "Walker_isActive_idx" ON "Walker"("isActive");

-- CreateIndex
CREATE INDEX "Dog_ownerId_archivedAt_idx" ON "Dog"("ownerId", "archivedAt");

-- CreateIndex
CREATE INDEX "WalkBooking_walkerId_startAt_idx" ON "WalkBooking"("walkerId", "startAt");

-- CreateIndex
CREATE INDEX "WalkBooking_ownerId_startAt_idx" ON "WalkBooking"("ownerId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "WalkerReview_walkId_key" ON "WalkerReview"("walkId");

-- CreateIndex
CREATE INDEX "WalkerReview_walkerId_createdAt_idx" ON "WalkerReview"("walkerId", "createdAt");

-- AddForeignKey
ALTER TABLE "PetOwner" ADD CONSTRAINT "PetOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Walker" ADD CONSTRAINT "Walker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dog" ADD CONSTRAINT "Dog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "PetOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkBooking" ADD CONSTRAINT "WalkBooking_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkBooking" ADD CONSTRAINT "WalkBooking_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "PetOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkBooking" ADD CONSTRAINT "WalkBooking_walkerId_fkey" FOREIGN KEY ("walkerId") REFERENCES "Walker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkerReview" ADD CONSTRAINT "WalkerReview_walkId_fkey" FOREIGN KEY ("walkId") REFERENCES "WalkBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkerReview" ADD CONSTRAINT "WalkerReview_walkerId_fkey" FOREIGN KEY ("walkerId") REFERENCES "Walker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkerReview" ADD CONSTRAINT "WalkerReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

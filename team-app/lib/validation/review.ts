import { z } from "zod";
import { clearableText, entityIdSchema, optionalText, paginationSchema } from "./common";

export const ratingSchema = z
  .number()
  .int({ error: "Rating must be a whole number" })
  .min(1, { error: "Rating must be between 1 and 5" })
  .max(5, { error: "Rating must be between 1 and 5" });

// POST /api/reviews (FR-030)
export const reviewCreateSchema = z.strictObject({
  walkId: entityIdSchema,
  rating: ratingSchema,
  comment: optionalText(1000),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

// PATCH /api/reviews/[id] (FR-032)
export const reviewUpdateSchema = z
  .strictObject({
    rating: ratingSchema,
    comment: clearableText(1000),
  })
  .partial();
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;

// PUT /api/reviews/[id]/reply (FR-033)
export const reviewReplySchema = z.strictObject({
  reply: z.string().trim().min(1, { error: "Reply can't be empty" }).max(500),
});
export type ReviewReplyInput = z.infer<typeof reviewReplySchema>;

// GET /api/reviews (FR-034)
export const reviewListQuerySchema = paginationSchema.extend({ walkerId: entityIdSchema });
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;

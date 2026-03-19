import { z } from "zod";

const participantNameSchema = z
  .string({ required_error: "Participant name is required." })
  .trim()
  .min(1, "Participant name is required.")
  .max(120, "Participant name must be 120 characters or fewer.");

export const entryInputSchema = z.object({
  participantName: participantNameSchema,
});

export const entryIdSchema = z
  .string({ required_error: "Entry id is required." })
  .trim()
  .min(1, "Entry id is required.");

export const entrySearchSchema = z
  .string()
  .trim()
  .max(120, "Search query is too long.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export type EntryInput = z.infer<typeof entryInputSchema>;

export function getFormStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function buildEntryName(participantName: string) {
  const trimmedParticipantName = participantName.trim();
  return `${trimmedParticipantName}'s Bracket`;
}

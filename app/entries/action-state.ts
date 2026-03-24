import type { PicksByGameId, BracketType } from "@/lib/brackets/types";

export type EntryFormValues = {
  participantName: string;
  bracketType: BracketType;
  picksByGameId: PicksByGameId;
};

export type EntryFormState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: EntryFormValues;
};

export const INITIAL_ENTRY_FORM_STATE: EntryFormState = {};

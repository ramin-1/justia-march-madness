export type EntryFormState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const INITIAL_ENTRY_FORM_STATE: EntryFormState = {};

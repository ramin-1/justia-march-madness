export type EntryFormState = {
  message?: string;
  fieldErrors?: {
    name?: string[];
    participantName?: string[];
  };
};

export const INITIAL_ENTRY_FORM_STATE: EntryFormState = {};

export type EntryFormState = {
  message?: string;
  fieldErrors?: {
    participantName?: string[];
  };
};

export const INITIAL_ENTRY_FORM_STATE: EntryFormState = {};

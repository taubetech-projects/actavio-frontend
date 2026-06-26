export const COMMON_AIRTABLE_FIELDS = [
  "Name", "Email", "Phone", "Status", "Notes", "Description",
  "Due Date", "Assignee", "Priority", "Tags", "Category",
  "Company", "Website", "Address", "City", "Country",
  "Created By", "Last Modified", "Attachment",
] as const;

export const AIRTABLE_ERROR_MESSAGES: Record<string, string> = {
  invalid_state:         "The OAuth session expired or was invalid. Please try again.",
  token_exchange_failed: "Failed to exchange the authorisation code. Please try again.",
  storage_failed:        "Connected but failed to save your credentials. Please try again.",
  access_denied:         "You declined the Airtable permissions. No changes were made.",
  unknown:               "An unexpected error occurred during Airtable connection.",
};

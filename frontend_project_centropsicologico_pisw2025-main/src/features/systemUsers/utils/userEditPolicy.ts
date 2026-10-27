// TEMPORARY: allow testing edits of existing seed/legacy users without documents.
// Set to false after the team finishes testing. Creation remains strict.
export const ALLOW_MISSING_DOCUMENTS_ON_EXISTING_USER_EDIT = true;

export function requiresUserDocuments(existingUserId?: string): boolean {
  return !existingUserId || !ALLOW_MISSING_DOCUMENTS_ON_EXISTING_USER_EDIT;
}

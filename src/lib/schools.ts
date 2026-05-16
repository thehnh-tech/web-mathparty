export function suggestHandleFromEmail(email: string): string {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  const clean = local.replace(/[^a-z0-9_]/g, "");
  return clean.slice(0, 20);
}

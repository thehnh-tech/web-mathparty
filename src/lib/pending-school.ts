import { cookies } from "next/headers";

const NAME_COOKIE = "pending_school";
const INITIAL_COOKIE = "pending_school_initial";

const baseOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60,
};

export async function setPendingSchool(name: string, initial: string) {
  const store = await cookies();
  const opts = { ...baseOpts, secure: process.env.NODE_ENV === "production" };
  store.set(NAME_COOKIE, name, opts);
  store.set(INITIAL_COOKIE, initial, opts);
}

export async function consumePendingSchool(): Promise<{ name: string; initial: string } | null> {
  const store = await cookies();
  const name = store.get(NAME_COOKIE)?.value;
  const initial = store.get(INITIAL_COOKIE)?.value;
  if (!name) return null;
  store.delete(NAME_COOKIE);
  store.delete(INITIAL_COOKIE);
  return { name, initial: initial ?? "" };
}

interface RawUniversity {
  name: string;
  domains: string[];
  country: string;
  alpha_two_code: string;
  web_pages: string[];
}

export interface University {
  name: string;
  domain: string;
  country: string;
  initial: string;
}

const API_BASE = "http://universities.hipolabs.com";

const SPECIAL_INITIALS: Record<string, string> = {
  "polytechnique.edu": "X",
  "ens.fr": "ENS",
  "ens-lyon.fr": "ENS Lyon",
};

export function initialFromName(name: string): string {
  const cleaned = name.replace(/[^A-Za-zÀ-ÿ\s]/g, " ");
  const words = cleaned.split(/\s+/).filter(Boolean);
  const skip = new Set(["of", "the", "de", "du", "des", "la", "le", "et", "and"]);
  const significant = words.filter((w) => !skip.has(w.toLowerCase()));
  const source = significant.length > 0 ? significant : words;
  if (source.length === 1) return source[0].charAt(0).toUpperCase();
  return source.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
}

function normalize(raw: RawUniversity, primaryDomain?: string): University {
  const domain = (primaryDomain ?? raw.domains[0] ?? "").toLowerCase();
  const initial = SPECIAL_INITIALS[domain] ?? initialFromName(raw.name);
  return {
    name: raw.name,
    domain,
    country: raw.country,
    initial,
  };
}

export async function lookupSchoolByDomain(email: string): Promise<University | null> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  try {
    const res = await fetch(`${API_BASE}/search?domain=${encodeURIComponent(domain)}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RawUniversity[];
    if (!data.length) return null;
    return normalize(data[0], domain);
  } catch {
    return null;
  }
}

export async function searchSchools(query: string, limit = 25): Promise<University[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const res = await fetch(`${API_BASE}/search?name=${encodeURIComponent(trimmed)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as RawUniversity[];
    return data.slice(0, limit).map((u) => normalize(u));
  } catch {
    return [];
  }
}

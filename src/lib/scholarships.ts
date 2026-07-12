// Shared model for the Youth Sports Access Finder.

export type Category = "scholarship" | "equipment" | "program";

export const CAT_META: Record<
  Category,
  { color: string; label: string; pin: string }
> = {
  scholarship: { color: "#8b5cf6", label: "Scholarship", pin: "🟣" },
  equipment: { color: "#22c55e", label: "Equipment", pin: "🟢" },
  program: { color: "#3b82f6", label: "Program", pin: "🔵" },
};

export const ASSISTANCE_OPTIONS = [
  { id: "scholarship", label: "Registration fee assistance" },
  { id: "equipment", label: "Free / discounted equipment" },
  { id: "adaptive", label: "Adaptive / disability programs" },
];

export type ScholarshipInputs = {
  location: string;
  sport: string;
  age: string;
  assistance: string[];
  lunch: boolean;
};

export type Opportunity = {
  id: string;
  title: string;
  url: string;
  source: string; // domain
  snippet: string;
  category: Category;
  lastUpdated?: string;
  deadline?: string;
  closed: boolean;
  x: number; // 0–100 map position
  y: number;
};

export type CenterEvent = { label: string; found: boolean };
export type SearchStatusEvent = { text: string };
export type SearchDoneEvent = { count: number };

export function categorize(text: string): Category {
  const t = text.toLowerCase();
  if (/\b(equipment|gear|cleat|shoe|uniform|jersey|donation drive|gear drive|used sports)\b/.test(t))
    return "equipment";
  if (/\b(scholarship|financial aid|grant|fee assistance|fee waiver|subsid|reduced[- ]price|free or reduced)\b/.test(t))
    return "scholarship";
  return "program";
}

export function detectClosed(text: string): boolean {
  // Conservative — only strong "not open right now" signals.
  return /\b(currently closed|applications?\s+(are\s+)?closed|not\s+(currently\s+)?accepting|closed\s+for\s+the\s+season|reopens?\b|applications?\s+(will\s+)?open\s+(in|on)|check\s+back\s+(later|soon|next))\b/i.test(
    text,
  );
}

export function detectDeadline(text: string): string | undefined {
  const m = text.match(
    /\b(deadline|due|apply by|closes?|register by)\b[^.\n]{0,44}?(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,?\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
  );
  return m ? m[0].replace(/\s+/g, " ").trim() : undefined;
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function buildPrompt(i: ScholarshipInputs): string {
  const asks: string[] = [];
  if (i.assistance.includes("scholarship"))
    asks.push("registration fee scholarships and financial aid");
  if (i.assistance.includes("equipment"))
    asks.push("free or discounted equipment and gear drives");
  if (i.assistance.includes("adaptive"))
    asks.push("adaptive and disability sports programs");
  if (!asks.length)
    asks.push("free or subsidized programs, scholarships, and equipment");

  const age = i.age ? `${i.age}-year-old ` : "";
  const lunch = i.lunch
    ? ", especially for families who qualify for free or reduced school lunch"
    : "";
  return `Find ${asks.join(", ")} for ${age}youth ${i.sport.toLowerCase()} near ${i.location}${lunch}. Include local parks & rec departments, clubs, leagues, and foundations, with application links and deadlines.`;
}

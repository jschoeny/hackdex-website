export function formatCompactNumber(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export type OrderedTag = { name: string; order: number };

export function sortOrderedTags<T extends OrderedTag>(rows: T[]): T[] {
  return [...rows]
    .filter((t) => !!t.name)
    .sort((a, b) => {
      const aHasOrder = a.order > 0;
      const bHasOrder = b.order > 0;
      if (aHasOrder && !bHasOrder) return -1;
      if (!aHasOrder && bHasOrder) return 1;
      if (aHasOrder && bHasOrder && a.order !== b.order) return a.order - b.order;
      return 0; // fallback to original array order
    });
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .replace(/[.,!?'"“”‘’\*\(\)]/g, "") // remove common punctuation
    .replace(/ß/g, "ss")
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

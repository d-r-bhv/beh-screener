// Simple token utilities for templating in UI + export.

export function substituteTokens(input: string, tokens: Record<string, string>): string {
  return input.replace(/\{\{(\w+)\}\}/g, (_, key) => tokens[key] ?? "");
}

export function withCategory(input: string, categoryName: string): string {
  const tokens = { categoryName };
  return substituteTokens(input, tokens);
}

// Capitalize first letter (used sparingly, leave client-facing wording as entered)
export function capFirst(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

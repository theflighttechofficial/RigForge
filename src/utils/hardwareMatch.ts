// Shared by the browser and the server: maps a free-text hardware name to a catalog entry

// Strip trademark noise so "Intel(R) Core(TM) i7-4790K CPU @ 4.00GHz" compares cleanly
export function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\((r|tm|c)\)|®|™/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/@.*$/, ' ')
    .replace(/\b(cpu|processor|graphics|with radeon|laptop gpu|\d+-core)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const BRAND_WORDS = new Set(['amd', 'intel', 'nvidia', 'geforce', 'radeon', 'core', 'ryzen', 'arc', 'black', 'edition']);

// Match when every significant token of a catalog model appears in the detected name; longest match wins
export function matchCatalog(detected: string, models: { id: string; Model: string }[]): string | null {
  const target = ` ${normalize(detected)} `;
  let best: { id: string; score: number } | null = null;
  for (const item of models) {
    const tokens = normalize(item.Model).split(' ').filter((t) => t && !BRAND_WORDS.has(t));
    if (!tokens.length) continue;
    if (tokens.every((t) => target.includes(` ${t} `))) {
      const score = tokens.join('').length;
      if (!best || score > best.score) best = { id: item.id, score };
    }
  }
  return best?.id ?? null;
}

import { z } from "zod";

const ScrapingDogResult = z.object({
  title: z.string().optional().default(""),
  link: z.string().optional().default(""),
  description: z.string().optional(),
  snippet: z.string().optional(),
});
const ScrapingDogResponse = z.object({
  organic_data: z.array(ScrapingDogResult).optional().default([]),
});

export type SearchResult = { title: string; link: string; snippet: string };

export async function scrapingdogSearch(
  query: string,
  apiKey: string,
  opts: { results?: number; country?: string } = {}
): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    results: String(opts.results ?? 10),
    country: opts.country ?? "us",
    advance_search: "false",
  });
  const res = await fetch(`https://api.scrapingdog.com/google?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`ScrapingDog API ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const json = await res.json();
  const parsed = ScrapingDogResponse.safeParse(json);
  if (!parsed.success) {
    throw new Error(`ScrapingDog response parse failed: ${parsed.error.message}`);
  }
  return parsed.data.organic_data
    .filter((r) => r.title && r.link)
    .map((r) => ({
      title: r.title || "",
      link: r.link || "",
      snippet: r.description ?? r.snippet ?? "",
    }));
}

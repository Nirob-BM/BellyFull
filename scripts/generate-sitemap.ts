// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://bellyfull.lovable.app";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://wzaxkzjxcgxnpyccjdqo.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6YXhremp4Y2d4bnB5Y2NqZHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODI1OTAsImV4cCI6MjA4Mjc1ODU5MH0.4_siiSe8aJlEKbn5dYyubEczCLxoRctFh7Wdkw6KhQM";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const today = new Date().toISOString().split("T")[0];

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0", lastmod: today },
  { path: "/menu", changefreq: "weekly", priority: "0.9", lastmod: today },
];

async function getDynamicEntries(): Promise<SitemapEntry[]> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, updated_at")
      .eq("is_active", true);
    if (error) throw error;
    return (data || []).map((row: { id: string; updated_at: string | null }) => ({
      path: `/product/${row.id}`,
      lastmod: row.updated_at ? row.updated_at.split("T")[0] : today,
      changefreq: "monthly" as const,
      priority: "0.7",
    }));
  } catch (err) {
    console.warn("[sitemap] Failed to fetch dynamic entries:", err);
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const dynamic = await getDynamicEntries();
  const entries = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
})();

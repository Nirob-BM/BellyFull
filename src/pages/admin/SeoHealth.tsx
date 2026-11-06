import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  FileCode,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Search,
  MapPin,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  isStatic: boolean;
}

interface RobotsRule {
  userAgent: string;
  allows: string[];
  disallows: string[];
}

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

const SeoHealth = () => {
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const [sitemapLoaded, setSitemapLoaded] = useState(false);
  const [sitemapError, setSitemapError] = useState<string | undefined>(undefined);
  const [sitemapUrls, setSitemapUrls] = useState<SitemapUrl[]>([]);
  const [sitemapTotal, setSitemapTotal] = useState(0);
  const [sitemapStaticCount, setSitemapStaticCount] = useState(0);
  const [sitemapDynamicCount, setSitemapDynamicCount] = useState(0);
  const [sitemapOldestLastmod, setSitemapOldestLastmod] = useState("");
  const [sitemapNewestLastmod, setSitemapNewestLastmod] = useState("");

  const [robotsLoaded, setRobotsLoaded] = useState(false);
  const [robotsError, setRobotsError] = useState<string | undefined>(undefined);
  const [robotsRaw, setRobotsRaw] = useState("");
  const [robotsRules, setRobotsRules] = useState<RobotsRule[]>([]);
  const [robotsSitemapDirective, setRobotsSitemapDirective] = useState<string | undefined>(undefined);

  const [activeDishes, setActiveDishes] = useState<{ id: string; name: string }[]>([]);
  const [menuError, setMenuError] = useState<string | undefined>(undefined);

  const fetchDbCounts = async () => {
    setMenuError(undefined);
    const { data, error } = await supabase.from("menu_items").select("id, name").eq("is_active", true);
    if (error) {
      setActiveDishes([]);
      setMenuError(error.message);
    } else {
      setActiveDishes((data as { id: string; name: string }[]) || []);
    }
  };

  const fetchSitemap = async () => {
    try {
      setSitemapError(undefined);
      const res = await fetch(`${baseUrl}/sitemap.xml?cb=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");
      if (xml.querySelector("parsererror") || xml.documentElement.localName !== "urlset") {
        throw new Error("The sitemap isn't valid XML (expected a <urlset>).");
      }
      const urlNodes = Array.from(xml.querySelectorAll("url"));
      const urls: SitemapUrl[] = urlNodes.map((node) => {
        const loc = node.querySelector("loc")?.textContent || "";
        const lastmod = node.querySelector("lastmod")?.textContent || "";
        const changefreq = node.querySelector("changefreq")?.textContent || "";
        const priority = node.querySelector("priority")?.textContent || "";
        return {
          loc,
          lastmod,
          changefreq,
          priority,
          isStatic: loc === `${baseUrl}/` || loc === `${baseUrl}/menu`,
        };
      });

      const lastmods = urls.map((u) => u.lastmod).filter(Boolean).sort();
      setSitemapUrls(urls);
      setSitemapTotal(urls.length);
      setSitemapStaticCount(urls.filter((u) => u.isStatic).length);
      setSitemapDynamicCount(urls.filter((u) => /\/product\/[^/]+\/?$/.test(u.loc)).length);
      setSitemapOldestLastmod(lastmods[0] || "");
      setSitemapNewestLastmod(lastmods[lastmods.length - 1] || "");
      setSitemapLoaded(true);
    } catch (err: any) {
      setSitemapUrls([]);
      setSitemapTotal(0);
      setSitemapStaticCount(0);
      setSitemapDynamicCount(0);
      setSitemapOldestLastmod("");
      setSitemapNewestLastmod("");
      setSitemapError(err.message || "Could not load the sitemap");
      setSitemapLoaded(true);
    }
  };

  const fetchRobots = async () => {
    try {
      setRobotsError(undefined);
      const res = await fetch(`${baseUrl}/robots.txt?cb=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const lines = text.split(/\r?\n/);
      const rules: RobotsRule[] = [];
      let currentRule: RobotsRule | null = null;
      let sitemapDirective: string | undefined;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const lower = trimmed.toLowerCase();
        if (lower.startsWith("user-agent:")) {
          if (currentRule) rules.push(currentRule);
          currentRule = {
            userAgent: trimmed.slice(11).trim(),
            allows: [],
            disallows: [],
          };
        } else if (lower.startsWith("allow:") && currentRule) {
          currentRule.allows.push(trimmed.slice(6).trim());
        } else if (lower.startsWith("disallow:") && currentRule) {
          currentRule.disallows.push(trimmed.slice(9).trim());
        } else if (lower.startsWith("sitemap:")) {
          sitemapDirective = trimmed.slice(8).trim();
        }
      }
      if (currentRule) rules.push(currentRule);

      setRobotsRaw(text);
      setRobotsRules(rules);
      setRobotsSitemapDirective(sitemapDirective);
      setRobotsLoaded(true);
    } catch (err: any) {
      setRobotsError(err.message);
      setRobotsLoaded(true);
    }
  };

  const runChecks = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSitemap(), fetchRobots(), fetchDbCounts()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await fetch(`${baseUrl}/sitemap.xml?cb=${Date.now()}`, { cache: "reload" });
      await runChecks();
    } finally {
      setRegenerating(false);
    }
  };

  const productIds = new Set(
    sitemapUrls
      .map((u) => u.loc.match(/\/product\/([^/?#]+)\/?$/)?.[1])
      .filter((id): id is string => !!id)
      .map((id) => decodeURIComponent(id)),
  );
  const activeIds = new Set(activeDishes.map((d) => d.id));
  const missingDishes = activeDishes.filter((d) => !productIds.has(d.id));
  const orphanUrls = sitemapUrls.filter((u) => {
    const id = u.loc.match(/\/product\/([^/?#]+)\/?$/)?.[1];
    return id && !activeIds.has(decodeURIComponent(id));
  });

  const sitemapWarnings: string[] = [];
  if (sitemapLoaded && !sitemapError) {
    if (sitemapTotal < 3) {
      sitemapWarnings.push("Sitemap has very few entries.");
    }
  }

  const robotsWarnings: string[] = [];
  if (robotsLoaded && !robotsError) {
    if (!robotsSitemapDirective) {
      robotsWarnings.push("No Sitemap directive found in robots.txt.");
    }
    const wildcard = robotsRules.find((r) => r.userAgent === "*");
    if (!wildcard) {
      robotsWarnings.push("No catch-all User-agent: * block found.");
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">SEO Health Check</h1>
          <p className="text-muted-foreground">
            Verify sitemap generation and indexing settings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRegenerate} disabled={regenerating || loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild variant="outline">
            <a href={`${baseUrl}/sitemap.xml`} target="_blank" rel="noopener noreferrer">
              <FileCode className="h-4 w-4 mr-2" />
              View sitemap.xml
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`${baseUrl}/robots.txt`} target="_blank" rel="noopener noreferrer">
              <ShieldCheck className="h-4 w-4 mr-2" />
              View robots.txt
            </a>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${sitemapError ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                  {sitemapError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : sitemapError ? "Error" : sitemapTotal}
                  </p>
                  <p className="text-xs text-muted-foreground">Sitemap URLs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${robotsError ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                  {robotsError ? <AlertCircle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : robotsRules.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Robots Rules</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10 text-info">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : sitemapError ? "Error" : sitemapDynamicCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Product URLs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-1/10 text-chart-1">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : sitemapError ? "—" : sitemapNewestLastmod || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Newest Lastmod</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sitemap Panel */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full min-w-0">
            <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCode className="h-5 w-5" />
                  Sitemap Details
                </CardTitle>
                <CardDescription className="break-all">
                  {baseUrl}/sitemap.xml
                </CardDescription>
              </div>
              <Badge variant={sitemapError ? "destructive" : "default"}>
                {sitemapError ? "Error" : `${sitemapTotal} URLs`}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {sitemapError ? (
                <div className="flex items-start gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm">{sitemapError}</p>
                </div>
              ) : (
                <>
                  <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="min-w-0 break-words bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Static Pages</p>
                      <p className="font-semibold">{sitemapStaticCount}</p>
                    </div>
                    <div className="min-w-0 break-words bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Product Pages</p>
                      <p className="font-semibold">{sitemapDynamicCount}</p>
                    </div>
                    <div className="min-w-0 break-words bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Oldest Lastmod</p>
                      <p className="font-semibold">{sitemapOldestLastmod || "—"}</p>
                    </div>
                    <div className="min-w-0 break-words bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Newest Lastmod</p>
                      <p className="font-semibold">{sitemapNewestLastmod || "—"}</p>
                    </div>
                  </div>

                  {sitemapWarnings.length > 0 && (
                    <div className="space-y-2">
                      {sitemapWarnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-warning bg-warning/10 p-3 rounded-lg text-sm">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          {w}
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {sitemapUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          {url.isStatic ? (
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate text-muted-foreground" title={url.loc}>
                            {url.loc.replace(baseUrl, "")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[10px] text-muted-foreground">{url.changefreq}</span>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                            {url.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Robots Panel */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="h-full min-w-0">
            <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5" />
                  robots.txt
                </CardTitle>
                <CardDescription className="break-all">
                  {baseUrl}/robots.txt
                </CardDescription>
              </div>
              <Badge variant={robotsError ? "destructive" : "default"}>
                {robotsError ? "Error" : `${robotsRules.length} Agents`}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {robotsError ? (
                <div className="flex items-start gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm">{robotsError}</p>
                </div>
              ) : (
                <>
                  <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="min-w-0 break-words bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Sitemap Directive</p>
                      <p className="font-semibold truncate">
                        {robotsSitemapDirective ? (
                          <a
                            href={robotsSitemapDirective}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {robotsSitemapDirective.replace(baseUrl, "")}
                          </a>
                        ) : (
                          <span className="text-destructive">None</span>
                        )}
                      </p>
                    </div>
                    <div className="min-w-0 break-words bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Blocked Paths (Wildcard)</p>
                      <p className="font-semibold">
                        {robotsRules.find((r) => r.userAgent === "*")?.disallows.length || 0}
                      </p>
                    </div>
                  </div>

                  {robotsWarnings.length > 0 && (
                    <div className="space-y-2">
                      {robotsWarnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-warning bg-warning/10 p-3 rounded-lg text-sm">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          {w}
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                    {robotsRules.map((rule, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          User-agent: {rule.userAgent}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {rule.allows.map((a, i) => (
                            <Badge key={`allow-${i}`} variant="outline" className="text-success border-success/30 bg-success/10 text-[10px]">
                              Allow {a}
                            </Badge>
                          ))}
                          {rule.disallows.map((d, i) => (
                            <Badge key={`disallow-${i}`} variant="outline" className="text-destructive border-destructive/30 bg-destructive/10 text-[10px]">
                              Disallow {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Menu vs sitemap */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Menu vs sitemap
          </CardTitle>
          <CardDescription>Checks that every active dish has a page in the sitemap, and no removed dish is still listed.</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          {loading ? (
            <p className="text-sm text-muted-foreground">Checking…</p>
          ) : sitemapError || menuError ? (
            <p role="alert" className="break-words text-sm text-destructive">
              Comparison unavailable: {sitemapError || menuError}
            </p>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2">
              <section className="min-w-0">
                <h3 className="font-medium">Dishes missing from sitemap ({missingDishes.length})</h3>
                {missingDishes.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {missingDishes.map((d) => <li key={d.id} className="break-words">{d.name}</li>)}
                  </ul>
                ) : <p className="mt-2 text-sm text-success">All {activeDishes.length} active dishes are listed.</p>}
              </section>
              <section className="min-w-0">
                <h3 className="font-medium">Sitemap pages with no active dish ({orphanUrls.length})</h3>
                {orphanUrls.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {orphanUrls.map((u, i) => <li key={`${u.loc}-${i}`} className="break-all">{u.loc}</li>)}
                  </ul>
                ) : <p className="mt-2 text-sm text-success">None.</p>}
              </section>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Tools */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              Submit to Search Engines
            </CardTitle>
            <CardDescription>
              Submit your sitemap to Google and Bing so your pages get indexed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              <Button asChild variant="outline" className="h-auto py-3 justify-start">
                <a
                  href={`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(baseUrl + "/")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Search className="h-4 w-4 mr-2 shrink-0" />
                  <span className="flex-1 text-left">
                    <span className="block font-medium">Google Search Console</span>
                    <span className="block text-xs text-muted-foreground">Submit sitemap</span>
                  </span>
                  <ExternalLink className="h-3 w-3 ml-2 shrink-0 opacity-60" />
                </a>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 justify-start">
                <a
                  href={`https://www.bing.com/webmasters/sitemaps?siteUrl=${encodeURIComponent(baseUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Search className="h-4 w-4 mr-2 shrink-0" />
                  <span className="flex-1 text-left">
                    <span className="block font-medium">Bing Webmaster Tools</span>
                    <span className="block text-xs text-muted-foreground">Submit sitemap</span>
                  </span>
                  <ExternalLink className="h-3 w-3 ml-2 shrink-0 opacity-60" />
                </a>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 justify-start">
                <a
                  href="https://docs.lovable.dev/tips-tricks/seo"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="h-4 w-4 mr-2 shrink-0" />
                  <span className="flex-1 text-left">
                    <span className="block font-medium">SEO Best Practices</span>
                    <span className="block text-xs text-muted-foreground">Read the guide</span>
                  </span>
                  <ExternalLink className="h-3 w-3 ml-2 shrink-0 opacity-60" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SeoHealth;

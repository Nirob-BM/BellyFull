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

  const [dbActiveMenuItems, setDbActiveMenuItems] = useState(0);
  const [dbActiveCategories, setDbActiveCategories] = useState(0);
  const [dbActiveEvents, setDbActiveEvents] = useState(0);
  const [dbPublishedPosts, setDbPublishedPosts] = useState(0);

  const fetchDbCounts = async () => {
    try {
      const menu = await supabase.from("menu_items").select("id").eq("is_active", true);
      const categories = await supabase.from("categories").select("id").eq("is_active", true);
      const events = await supabase.from("events").select("id").eq("is_active", true);
      const posts = await supabase.from("blog_posts").select("id").eq("is_published", true);
      setDbActiveMenuItems(menu.data?.length || 0);
      setDbActiveCategories(categories.data?.length || 0);
      setDbActiveEvents(events.data?.length || 0);
      setDbPublishedPosts(posts.data?.length || 0);
    } catch {
      // silently fail DB counts
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
      setSitemapDynamicCount(urls.filter((u) => !u.isStatic).length);
      setSitemapOldestLastmod(lastmods[0] || "");
      setSitemapNewestLastmod(lastmods[lastmods.length - 1] || "");
      setSitemapLoaded(true);
    } catch (err: any) {
      setSitemapError(err.message);
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

  const sitemapWarnings: string[] = [];
  if (sitemapLoaded && !sitemapError) {
    if (sitemapDynamicCount !== dbActiveMenuItems) {
      sitemapWarnings.push(
        `Sitemap has ${sitemapDynamicCount} product URLs, but database shows ${dbActiveMenuItems} active menu items.`
      );
    }
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">SEO Health Check</h1>
          <p className="text-muted-foreground">
            Verify sitemap generation and indexing settings.
          </p>
        </div>
        <div className="flex gap-2">
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
                <div className={`p-2 rounded-lg ${sitemapError ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                  {sitemapError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : sitemapTotal}
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
                <div className={`p-2 rounded-lg ${robotsError ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
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
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : dbActiveMenuItems}
                  </p>
                  <p className="text-xs text-muted-foreground">Active Menu Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : sitemapNewestLastmod || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Newest Lastmod</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sitemap Panel */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCode className="h-5 w-5" />
                  Sitemap Details
                </CardTitle>
                <CardDescription>
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
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Static Pages</p>
                      <p className="font-semibold">{sitemapStaticCount}</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Product Pages</p>
                      <p className="font-semibold">{sitemapDynamicCount}</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Oldest Lastmod</p>
                      <p className="font-semibold">{sitemapOldestLastmod || "—"}</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Newest Lastmod</p>
                      <p className="font-semibold">{sitemapNewestLastmod || "—"}</p>
                    </div>
                  </div>

                  {sitemapWarnings.length > 0 && (
                    <div className="space-y-2">
                      {sitemapWarnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-amber-600 bg-amber-500/10 p-3 rounded-lg text-sm">
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
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5" />
                  robots.txt
                </CardTitle>
                <CardDescription>
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
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/50 p-3 rounded-lg">
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
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs">Blocked Paths (Wildcard)</p>
                      <p className="font-semibold">
                        {robotsRules.find((r) => r.userAgent === "*")?.disallows.length || 0}
                      </p>
                    </div>
                  </div>

                  {robotsWarnings.length > 0 && (
                    <div className="space-y-2">
                      {robotsWarnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-amber-600 bg-amber-500/10 p-3 rounded-lg text-sm">
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
                            <Badge key={`allow-${i}`} variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px]">
                              Allow {a}
                            </Badge>
                          ))}
                          {rule.disallows.map((d, i) => (
                            <Badge key={`disallow-${i}`} variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">
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

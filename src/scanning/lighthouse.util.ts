// Ported field-for-field from Audit Magnet CRM (#11)'s
// src/scanning/lighthouse.util.ts (itself ported from leadMarketing's
// lib/scanner.ts) — identical logic, no changes needed for this product.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TIMEOUT = 10_000;

export interface LighthouseScanResult {
  url: string;
  https: boolean;
  hsts: boolean;
  xfo: boolean;
  csp: boolean;
  xcto: boolean;
  xssHeader: boolean;
  secScore: number;
  hasTitle: boolean;
  hasMeta: boolean;
  hasH1: boolean;
  hasCanonical: boolean;
  hasOg: boolean;
  hasRobots: boolean;
  hasSitemap: boolean;
  seoScore: number;
  hasGa: boolean;
  hasGtm: boolean;
  hasFbPixel: boolean;
  hasLinkedIn: boolean;
  hasSchemaOrg: boolean;
  hasHotjar: boolean;
  semScore: number;
  statusCode?: number;
  error?: string;
}

function normalizeUrl(raw: string): string {
  if (!/^https?:\/\//i.test(raw)) return `https://${raw}`;
  return raw;
}

function securityScore(r: Partial<LighthouseScanResult>): number {
  let s = 0;
  if (r.https) s += 30;
  if (r.hsts) s += 15;
  if (r.xfo) s += 15;
  if (r.csp) s += 20;
  if (r.xcto) s += 10;
  if (r.xssHeader) s += 10;
  return s;
}

function seoScore(r: Partial<LighthouseScanResult>): number {
  let s = 0;
  if (r.hasTitle) s += 20;
  if (r.hasMeta) s += 20;
  if (r.hasH1) s += 15;
  if (r.hasCanonical) s += 10;
  if (r.hasOg) s += 10;
  if (r.hasRobots) s += 15;
  if (r.hasSitemap) s += 10;
  return s;
}

function semScore(r: Partial<LighthouseScanResult>): number {
  let s = 0;
  if (r.hasGa) s += 30;
  if (r.hasGtm) s += 20;
  if (r.hasFbPixel) s += 15;
  if (r.hasSchemaOrg) s += 15;
  if (r.hasLinkedIn) s += 10;
  if (r.hasHotjar) s += 10;
  return s;
}

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
    });
  } finally {
    clearTimeout(t);
  }
}

async function checkResource(url: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(url, 5000);
    return res.ok;
  } catch {
    return false;
  }
}

export async function scanWebsite(rawUrl: string): Promise<LighthouseScanResult> {
  const url = normalizeUrl(rawUrl);
  const base: LighthouseScanResult = {
    url,
    https: url.startsWith('https://'),
    hsts: false,
    xfo: false,
    csp: false,
    xcto: false,
    xssHeader: false,
    secScore: 0,
    hasTitle: false,
    hasMeta: false,
    hasH1: false,
    hasCanonical: false,
    hasOg: false,
    hasRobots: false,
    hasSitemap: false,
    seoScore: 0,
    hasGa: false,
    hasGtm: false,
    hasFbPixel: false,
    hasLinkedIn: false,
    hasSchemaOrg: false,
    hasHotjar: false,
    semScore: 0,
  };

  let res: Response;
  try {
    res = await fetchWithTimeout(url, TIMEOUT);
    base.statusCode = res.status;
  } catch (err) {
    base.error = String(err);
    base.secScore = securityScore(base);
    base.seoScore = seoScore(base);
    base.semScore = semScore(base);
    return base;
  }

  base.hsts = res.headers.has('strict-transport-security');
  base.xfo = res.headers.has('x-frame-options');
  base.csp = res.headers.has('content-security-policy');
  base.xcto = res.headers.has('x-content-type-options');
  base.xssHeader = res.headers.has('x-xss-protection');

  let finalOrigin = url;
  try {
    if (res.url) {
      if (res.url.startsWith('http://')) base.https = false;
      finalOrigin = new URL(res.url).origin;
    }
  } catch {
    // keep original url as finalOrigin
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    const html = await res.text();
    const lc = html.toLowerCase();

    base.hasTitle = /<title[^>]*>[^<]{1,}/i.test(html);
    base.hasMeta = /<meta[^>]+name=["']description["']/i.test(html);
    base.hasH1 = /<h1[\s>]/i.test(html);
    base.hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
    base.hasOg = /<meta[^>]+property=["']og:/i.test(html) || /<meta[^>]+name=["']og:/i.test(html);

    base.hasGa =
      lc.includes('google-analytics.com') ||
      lc.includes('gtag(') ||
      lc.includes('ga(') ||
      /G-[A-Z0-9]{6,}/i.test(html) ||
      /UA-\d{6,}/i.test(html);
    base.hasGtm = lc.includes('googletagmanager.com/gtm.js') || lc.includes('gtm.js');
    base.hasFbPixel = lc.includes('connect.facebook.net') || lc.includes('fbq(') || lc.includes('facebook-pixel');
    base.hasLinkedIn =
      lc.includes('_linkedin_partner_id') || lc.includes('snap.licdn.com') || lc.includes('linkedin.com/li_tag');
    base.hasSchemaOrg = lc.includes('application/ld+json') || lc.includes('schema.org') || lc.includes('itemscope');
    base.hasHotjar = lc.includes('hotjar.com') || lc.includes('hj(') || lc.includes('_hjsettings');

    const [robots, sitemap] = await Promise.all([
      checkResource(`${finalOrigin}/robots.txt`),
      checkResource(`${finalOrigin}/sitemap.xml`),
    ]);
    base.hasRobots = robots;
    base.hasSitemap = sitemap;
  }

  base.secScore = securityScore(base);
  base.seoScore = seoScore(base);
  base.semScore = semScore(base);
  return base;
}

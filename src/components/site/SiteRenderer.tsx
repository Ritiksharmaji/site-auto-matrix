import type { CSSProperties } from "react";
import type { Brand, FormFieldDef, ModuleDef, SectionContent, SectionItem, Theme } from "@/modules/types";
import { fontCss, radiusCss, sectionVariant, SPACING_OPTIONS } from "@/modules/shared";
import EnquiryForm, { type ExtraField } from "./EnquiryForm";

// Renders a full client website from: module definition + enabled sections +
// theme + content. Every visual choice reads from CSS variables set on the root,
// so changing the theme restyles the whole site.

type Props = {
  siteId: string;
  module: ModuleDef;
  enabledSections: string[];
  theme: Theme;
  brand: Brand;
  sections: Record<string, SectionContent>;
  basePath?: string;
};

export function googleFontsHref(theme: Theme) {
  const families = Array.from(new Set([theme.headingFont, theme.bodyFont]))
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/** True when a hex colour is dark (used to pick readable colours for dark themes). */
function isDarkColor(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum < 0.45;
}

export default function SiteRenderer({ siteId, module, enabledSections, theme, brand, sections }: Props) {
  // Sections render in the site's own saved order.
  const defs = module.sections
    .filter((s) => enabledSections.includes(s.key))
    .sort((a, b) => enabledSections.indexOf(a.key) - enabledSections.indexOf(b.key));
  const navItems = defs.filter((d) => !["hero", "stats", "logos", "cta"].includes(d.kind));

  // Page structure; every option falls back to the original look.
  const header = theme.header ?? "auto";
  const sticky = theme.headerSticky ?? true;
  const footer = theme.footer ?? "columns";
  const buttons = theme.buttonStyle ?? "auto";
  const spacing = SPACING_OPTIONS.find((o) => o.value === theme.spacing)?.px ?? 80;
  const variant = (key: string, kind: Parameters<typeof sectionVariant>[0]) => sectionVariant(kind, theme.variants?.[key]);
  const heroDark = theme.style === "modern" || header === "transparent" || theme.heroLayout === "background";
  const contactKey = defs.find((d) => d.kind === "contact")?.key;
  const ctaLabel = (sections[defs.find((d) => d.kind === "hero")?.key ?? ""]?.ctaLabel as string) || "Contact us";

  const vars = {
    "--c-primary": theme.primary,
    "--c-secondary": theme.secondary,
    "--c-bg": theme.background,
    "--c-surface": theme.surface,
    "--c-text": theme.text,
    "--f-heading": fontCss(theme.headingFont),
    "--f-body": fontCss(theme.bodyFont),
    "--radius": radiusCss(theme.radius),
    "--sp": `${spacing}px`,
  } as CSSProperties;

  const classes = [
    "site",
    `site-${theme.style}`,
    `hdr-${header}`,
    sticky ? "" : "hdr-static",
    `btn-${buttons}`,
    isDarkColor(theme.background) ? "site-dark" : "",
    "min-h-screen",
  ].filter(Boolean).join(" ");

  const logo = (
    <a href="#top" className="flex items-center gap-3">
      {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logo} alt={brand.siteName} className="h-10 w-auto" />
      ) : (
        <span className="site-logo-mark">{brand.siteName.charAt(0)}</span>
      )}
      <span className="site-heading text-lg font-bold leading-tight">{brand.siteName}</span>
    </a>
  );
  const headerButton = theme.headerCta && contactKey ? (
    <a href={`#${contactKey}`} className="site-btn site-btn-sm site-hdr-btn">{ctaLabel}</a>
  ) : null;
  const mobileNav = (
    <details className="site-mobile-nav md:hidden">
      <summary aria-label="Open menu">☰</summary>
      <nav className="site-mobile-menu">
        {navItems.map((d) => (
          <a key={d.key} href={`#${d.key}`}>{d.navLabel ?? d.label}</a>
        ))}
        {theme.headerCta && contactKey && <a href={`#${contactKey}`} className="site-mobile-cta">{ctaLabel}</a>}
      </nav>
    </details>
  );
  const desktopNav = (
    <nav className="hidden items-center gap-5 whitespace-nowrap text-sm font-medium md:flex">
      {navItems.map((d) => (
        <a key={d.key} href={`#${d.key}`} className="site-nav-link">
          {d.navLabel ?? d.label}
        </a>
      ))}
    </nav>
  );

  return (
    <div style={vars} className={classes} data-style={theme.style}>
      <link rel="stylesheet" href={googleFontsHref(theme)} precedence="default" />
      <SiteStyles />
      {header !== "none" && (
        <header className="site-header">
          {header === "centered" ? (
            <div className="site-container flex flex-col items-center gap-3 py-4 md:py-5">
              <div className="flex w-full items-center justify-between md:justify-center">
                {logo}
                {mobileNav}
              </div>
              <div className="hidden items-center gap-6 md:flex">
                {desktopNav}
                {headerButton}
              </div>
            </div>
          ) : (
            <div className="site-container flex items-center justify-between gap-6 py-4">
              {logo}
              <div className="flex items-center gap-5">
                {desktopNav}
                {headerButton}
              </div>
              {mobileNav}
            </div>
          )}
        </header>
      )}

      <main id="top">
        {defs.map((def) => {
          const c = sections[def.key] ?? def.defaults;
          const items = (c.items as SectionItem[] | undefined) ?? [];
          const v = variant(def.key, def.kind);
          switch (def.kind) {
            case "hero":
              return <Hero key={def.key} id={def.key} c={c} layout={theme.heroLayout} dark={heroDark} />;
            case "about":
              return <About key={def.key} id={def.key} c={c} variant={v} />;
            case "stats":
              return <Stats key={def.key} id={def.key} c={c} items={items} variant={v} />;
            case "cards":
              return <Cards key={def.key} id={def.key} c={c} items={items} variant={v} />;
            case "list":
              return <List key={def.key} id={def.key} c={c} items={items} variant={v} />;
            case "gallery":
              return <Gallery key={def.key} id={def.key} c={c} items={items} variant={v} />;
            case "testimonials":
              return <Testimonials key={def.key} id={def.key} c={c} items={items} variant={v} />;
            case "products":
              return <Products key={def.key} id={def.key} c={c} items={items} whatsapp={whatsappNumber(brand)} />;
            case "faq":
              return <Faq key={def.key} id={def.key} c={c} items={items} variant={v} />;
            case "pricing":
              return <Pricing key={def.key} id={def.key} c={c} items={items} />;
            case "code":
              return <CodeBlock key={def.key} id={def.key} c={c} variant={v} />;
            case "logos":
              return <Logos key={def.key} id={def.key} c={c} items={items} variant={v} />;
            case "cta":
              return <Cta key={def.key} id={def.key} c={c} variant={v} />;
            case "contact":
              return (
                <Contact key={def.key} id={def.key} c={c} brand={brand} siteId={siteId} formType={def.key} variant={v} extraFields={extraFields(def.formFields, module, sections, enabledSections)} />
              );
          }
        })}
      </main>

      {whatsappNumber(brand) && (
        <a href={`https://wa.me/${whatsappNumber(brand)}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="site-wa-float">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.4 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.8-1.1-4.6-4-4.8-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2Z"/></svg>
        </a>
      )}

      {footer === "columns" && (
        <footer className="site-footer">
          <div className="site-container grid gap-6 py-10 text-sm md:grid-cols-3">
            <div>
              <p className="site-heading text-base font-bold">{brand.siteName}</p>
              <p className="mt-1 opacity-80">{brand.tagline}</p>
            </div>
            <div className="space-y-1 opacity-90">
              {brand.address && <p>{brand.address}</p>}
              {brand.phone && <p>{brand.phone}</p>}
              {brand.email && <p>{brand.email}</p>}
            </div>
            <p className="opacity-70 md:text-right">
              © {new Date().getFullYear()} {brand.footerText || brand.siteName}
            </p>
          </div>
        </footer>
      )}
      {footer === "simple" && (
        <footer className="site-footer site-footer-simple">
          <div className="site-container flex flex-col items-center justify-between gap-2 py-6 text-sm md:flex-row">
            <p className="site-heading font-bold">{brand.siteName}</p>
            <p className="opacity-70">© {new Date().getFullYear()} {brand.footerText || brand.siteName}</p>
          </div>
        </footer>
      )}
    </div>
  );
}

/** Resolves a contact section's extra questions, filling select options from another section's item titles. */
function extraFields(defs: FormFieldDef[] | undefined, module: ModuleDef, sections: Record<string, SectionContent>, enabled: string[]): ExtraField[] {
  // A choice list whose source section is switched off would offer options the site doesn't show.
  return (defs ?? []).filter((f) => !f.optionsFromSection || enabled.includes(f.optionsFromSection)).map((f) => {
    if (f.type !== "select") return { key: f.key, label: f.label, type: f.type, placeholder: f.placeholder };
    const source = f.optionsFromSection ? (sections[f.optionsFromSection] ?? module.sections.find((s) => s.key === f.optionsFromSection)?.defaults) : undefined;
    const options = ((source?.items as SectionItem[] | undefined) ?? []).map((it) => it.title).filter(Boolean);
    return { key: f.key, label: f.label, type: "select", placeholder: f.placeholder, options: [...options, "Not sure yet"] };
  });
}

/** Only allow ordinary web, mail, phone and on-page links in editable content. */
function safeHref(href: string | undefined) {
  const h = (href ?? "").trim();
  return /^(https?:\/\/|mailto:|tel:|#|\/)/i.test(h) ? h : "";
}

/** Digits-only WhatsApp number, or "" when not set. */
function whatsappNumber(brand: Brand) {
  return (brand.whatsapp ?? "").replace(/\D/g, "");
}

function Products({ id, c, items, whatsapp }: { id: string; c: SectionContent; items: SectionItem[]; whatsapp: string }) {
  const categories = Array.from(new Set(items.map((it) => it.category?.trim() || "")));
  const orderLabel = (c.orderLabel as string) || "Order now";
  return (
    <section id={id} className="site-section site-alt">
      <div className="site-container">
        <SectionHeader c={c} />
        {categories.map((cat) => (
          <div key={cat || "_"} className="mb-12 last:mb-0">
            {cat && categories.length > 1 && <h3 className="site-heading mb-5 text-xl font-semibold">{cat}</h3>}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items
                .filter((it) => (it.category?.trim() || "") === cat)
                .map((it, i) => {
                  const href = whatsapp
                    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I'd like to order: ${it.title}${it.price ? ` (${it.price})` : ""}`)}`
                    : "#contact";
                  return (
                    <article key={i} className="site-card flex flex-col !p-0 overflow-hidden">
                      <ImageOrPlaceholder src={it.image} alt={it.title} className="aspect-square w-full" />
                      <div className="flex flex-1 flex-col p-5">
                        <h4 className="site-heading text-lg font-semibold">{it.title}</h4>
                        {it.description && <p className="mt-1 text-sm opacity-75">{it.description}</p>}
                        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                          {it.price && <span className="site-price">{it.price}</span>}
                          <a href={href} target={whatsapp ? "_blank" : undefined} rel="noreferrer" className="site-btn site-btn-sm">{orderLabel}</a>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ c }: { c: SectionContent }) {
  if (!c.title && !c.subtitle) return null;
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {c.title && <h2 className="site-heading text-3xl font-bold md:text-4xl">{c.title as string}</h2>}
      {c.subtitle && <p className="mt-3 text-base opacity-75">{c.subtitle as string}</p>}
    </div>
  );
}

function ImageOrPlaceholder({ src, alt, className }: { src?: string; alt: string; className: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`${className} object-cover`} />;
  }
  return <div className={`${className} site-placeholder`} aria-hidden />;
}

function HeroButton({ c }: { c: SectionContent }) {
  if (!c.ctaLabel) return null;
  return (
    <a href={safeHref(c.ctaLink as string) || "#contact"} className="site-btn mt-8">
      {c.ctaLabel as string}
    </a>
  );
}

function Hero({ id, c, layout, dark }: { id: string; c: SectionContent; layout: Theme["heroLayout"]; dark: boolean }) {
  const image = c.image as string;
  const centered = layout === "centered" || layout === "background";
  const text = (
    <div className={centered ? "mx-auto max-w-3xl text-center" : ""}>
      <h1 className="site-heading text-4xl font-bold leading-tight md:text-5xl">{c.headline as string}</h1>
      <p className="mt-5 text-lg opacity-85">{c.subheadline as string}</p>
      <HeroButton c={c} />
    </div>
  );
  if (layout === "background") {
    return (
      <section id={id} className="site-hero site-hero-dark site-hero-bg">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="site-hero-bg-img" />
        )}
        <div className="site-container site-hero-pad relative py-28 md:py-40">{text}</div>
      </section>
    );
  }
  const split = layout === "split" || layout === "split-reverse";
  return (
    <section id={id} className={`site-hero ${dark ? "site-hero-dark" : ""}`}>
      <div className="site-container site-hero-pad py-20 md:py-28">
        {split ? (
          <div className="grid items-center gap-12 md:grid-cols-2">
            {layout === "split-reverse" && <ImageOrPlaceholder src={image} alt="" className="site-rounded aspect-[4/3] w-full" />}
            {text}
            {layout === "split" && <ImageOrPlaceholder src={image} alt="" className="site-rounded aspect-[4/3] w-full" />}
          </div>
        ) : (
          text
        )}
      </div>
    </section>
  );
}

function Paragraphs({ text, className = "mt-4 leading-relaxed opacity-85" }: { text: unknown; className?: string }) {
  return (
    <>
      {String(text ?? "")
        .split(/\n+/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>{p}</p>
        ))}
    </>
  );
}

function About({ id, c, variant }: { id: string; c: SectionContent; variant: string }) {
  const image = c.image as string;
  // Without a photo the text gets the full width instead of sitting next to an empty box.
  if (!image || variant === "centered") {
    return (
      <section id={id} className="site-section">
        <div className="site-container max-w-3xl text-center">
          <h2 className="site-heading text-3xl font-bold md:text-4xl">{c.title as string}</h2>
          <Paragraphs text={c.body} />
          {image && <ImageOrPlaceholder src={image} alt="" className="site-rounded mt-10 aspect-[16/9] w-full" />}
        </div>
      </section>
    );
  }
  const img = <ImageOrPlaceholder src={image} alt="" className="site-rounded aspect-[4/3] w-full" />;
  return (
    <section id={id} className="site-section">
      <div className="site-container grid items-center gap-12 md:grid-cols-2">
        {variant !== "image-right" && img}
        <div>
          <h2 className="site-heading text-3xl font-bold md:text-4xl">{c.title as string}</h2>
          <Paragraphs text={c.body} />
        </div>
        {variant === "image-right" && img}
      </div>
    </section>
  );
}

function Stats({ id, c, items, variant }: { id: string; c: SectionContent; items: SectionItem[]; variant: string }) {
  if (variant === "cards") {
    return (
      <section id={id} className="site-section">
        <div className="site-container">
          <SectionHeader c={c} />
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {items.map((it, i) => (
              <div key={i} className="site-card text-center">
                <p className="site-heading site-stat-value text-3xl font-bold md:text-4xl">{it.value}</p>
                <p className="mt-1 text-sm opacity-75">{it.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id={id} className="site-stats">
      <div className="site-container grid grid-cols-2 gap-8 py-12 text-center md:grid-cols-4">
        {items.map((it, i) => (
          <div key={i}>
            <p className="site-heading text-3xl font-bold md:text-4xl">{it.value}</p>
            <p className="mt-1 text-sm opacity-85">{it.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CardLink({ it }: { it: SectionItem }) {
  const link = safeHref(it.link);
  if (!link) return null;
  return (
    <a href={link} target={link.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="site-link mt-auto pt-4 text-sm font-semibold">
      {it.linkLabel || "Learn more"} →
    </a>
  );
}

function CardIcon({ it }: { it: SectionItem }) {
  if (!it.icon) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={it.icon} alt="" className="site-icon mb-4 h-14 w-14" />;
}

function Cards({ id, c, items, variant }: { id: string; c: SectionContent; items: SectionItem[]; variant: string }) {
  if (variant === "alternating") {
    return (
      <section id={id} className="site-section site-alt">
        <div className="site-container">
          <SectionHeader c={c} />
          <div className="space-y-16">
            {items.map((it, i) => (
              <div key={i} className="grid items-center gap-10 md:grid-cols-2">
                <div className={i % 2 ? "md:order-2" : ""}>
                  <ImageOrPlaceholder src={it.image || it.icon} alt={it.title} className="site-rounded aspect-[4/3] w-full" />
                </div>
                <div className="flex flex-col">
                  {it.meta && <p className="site-meta">{it.meta}</p>}
                  <h3 className="site-heading mt-1 text-2xl font-bold">{it.title}</h3>
                  {it.description && <p className="mt-3 leading-relaxed opacity-80">{it.description}</p>}
                  <CardLink it={it} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  if (variant === "list") {
    return (
      <section id={id} className="site-section site-alt">
        <div className="site-container max-w-4xl">
          <SectionHeader c={c} />
          <div className="space-y-4">
            {items.map((it, i) => (
              <article key={i} className="site-card flex items-start gap-5">
                {it.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.icon} alt="" className="site-icon h-12 w-12 shrink-0" />
                ) : it.image ? (
                  <ImageOrPlaceholder src={it.image} alt={it.title} className="site-rounded hidden aspect-square w-28 shrink-0 sm:block" />
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col">
                  {it.meta && <p className="site-meta">{it.meta}</p>}
                  <h3 className="site-heading text-lg font-semibold">{it.title}</h3>
                  {it.description && <p className="mt-1 text-sm leading-relaxed opacity-80">{it.description}</p>}
                  <CardLink it={it} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id={id} className="site-section site-alt">
      <div className="site-container">
        <SectionHeader c={c} />
        {/* 4 across for 4 or 8 items; otherwise 3 across so rows stay balanced (e.g. 5 = 3 + 2). */}
        <div className={`grid gap-6 sm:grid-cols-2 ${items.length % 4 === 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {items.map((it, i) => (
            <article key={i} className="site-card flex flex-col">
              {it.image && <ImageOrPlaceholder src={it.image} alt={it.title} className="site-rounded mb-4 aspect-video w-full" />}
              <CardIcon it={it} />
              {it.meta && <p className="site-meta">{it.meta}</p>}
              <h3 className="site-heading mt-1 text-lg font-semibold">{it.title}</h3>
              {it.description && <p className="mt-2 text-sm leading-relaxed opacity-80">{it.description}</p>}
              <CardLink it={it} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatDate(d?: string) {
  if (!d) return "";
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function List({ id, c, items, variant }: { id: string; c: SectionContent; items: SectionItem[]; variant: string }) {
  if (variant === "timeline") {
    return (
      <section id={id} className="site-section">
        <div className="site-container max-w-3xl">
          <SectionHeader c={c} />
          <ol className="site-timeline">
            {items.map((it, i) => (
              <li key={i} className="relative pb-10 pl-10 last:pb-0">
                <span className="site-timeline-dot" aria-hidden />
                {it.date && <span className="site-date">{formatDate(it.date)}</span>}
                <h3 className="site-heading mt-1 text-lg font-semibold">{it.title}</h3>
                {it.description && <p className="mt-1 text-sm leading-relaxed opacity-80">{it.description}</p>}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }
  return (
    <section id={id} className="site-section">
      <div className="site-container max-w-4xl">
        <SectionHeader c={c} />
        <ul className="space-y-4">
          {items.map((it, i) => (
            <li key={i} className="site-card flex flex-col gap-2 md:flex-row md:items-start md:gap-6">
              {it.date && <span className="site-date shrink-0">{formatDate(it.date)}</span>}
              <div>
                <h3 className="site-heading font-semibold">{it.title}</h3>
                {it.description && <p className="mt-1 text-sm opacity-80">{it.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Gallery({ id, c, items, variant }: { id: string; c: SectionContent; items: SectionItem[]; variant: string }) {
  const wide = variant === "wide";
  return (
    <section id={id} className="site-section site-alt">
      <div className="site-container">
        <SectionHeader c={c} />
        <div className={wide ? "grid gap-6 md:grid-cols-2" : "grid grid-cols-2 gap-4 md:grid-cols-3"}>
          {items.map((it, i) => (
            <figure key={i}>
              <ImageOrPlaceholder src={it.image} alt={it.caption ?? ""} className={`site-rounded w-full ${wide ? "aspect-video" : "aspect-square"}`} />
              {it.caption && <figcaption className="mt-2 text-sm opacity-75">{it.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ id, c, items, variant }: { id: string; c: SectionContent; items: SectionItem[]; variant: string }) {
  const single = variant === "single";
  return (
    <section id={id} className="site-section">
      <div className={`site-container ${single ? "max-w-3xl" : ""}`}>
        <SectionHeader c={c} />
        <div className={single ? "space-y-6" : "grid gap-6 md:grid-cols-2"}>
          {items.map((it, i) => (
            <blockquote key={i} className={`site-card ${single ? "text-center" : ""}`}>
              <p className={single ? "site-heading text-2xl leading-snug" : "text-lg leading-relaxed"}>“{it.quote}”</p>
              <footer className="mt-4 text-sm">
                <span className="font-semibold">{it.name}</span>
                {it.role && <span className="opacity-70"> · {it.role}</span>}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ id, c, items, variant }: { id: string; c: SectionContent; items: SectionItem[]; variant: string }) {
  if (variant === "two-column") {
    return (
      <section id={id} className="site-section">
        <div className="site-container">
          <SectionHeader c={c} />
          <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
            {items.map((it, i) => (
              <div key={i}>
                <h3 className="site-heading text-lg font-semibold">{it.question}</h3>
                <p className="mt-2 leading-relaxed opacity-80">{it.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id={id} className="site-section">
      <div className="site-container max-w-3xl">
        <SectionHeader c={c} />
        <div className="space-y-3">
          {items.map((it, i) => (
            <details key={i} className="site-card site-faq" open={i === 0}>
              <summary className="site-heading cursor-pointer text-lg font-semibold">{it.question}</summary>
              <p className="mt-3 leading-relaxed opacity-80">{it.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ id, c, items }: { id: string; c: SectionContent; items: SectionItem[] }) {
  return (
    <section id={id} className="site-section site-alt">
      <div className="site-container">
        <SectionHeader c={c} />
        <div className={`mx-auto grid gap-6 ${items.length >= 3 ? "max-w-6xl md:grid-cols-3" : "max-w-3xl md:grid-cols-2"}`}>
          {items.map((it, i) => {
            const hot = /^y(es)?$/i.test((it.highlight ?? "").trim());
            const features = String(it.features ?? "").split(/\n+/).map((f) => f.trim()).filter(Boolean);
            return (
              <article key={i} className={`site-card site-plan flex flex-col ${hot ? "site-plan-hot" : ""}`}>
                {hot && <span className="site-plan-badge">Most popular</span>}
                <h3 className="site-heading text-lg font-semibold">{it.title}</h3>
                {it.description && <p className="mt-1 text-sm opacity-70">{it.description}</p>}
                <p className="mt-5">
                  <span className="site-heading text-4xl font-bold">{it.price}</span>
                  {it.period && <span className="ml-1 text-sm opacity-70">{it.period}</span>}
                </p>
                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  {features.map((f, j) => (
                    <li key={j} className="flex gap-2"><span className="site-check" aria-hidden>✓</span><span className="opacity-85">{f}</span></li>
                  ))}
                </ul>
                {it.ctaLabel && (
                  <a href={safeHref(it.ctaLink) || "#contact"} className={`site-btn mt-8 text-center ${hot ? "" : "site-btn-ghost"}`}>{it.ctaLabel}</a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CodeBlock({ id, c, variant }: { id: string; c: SectionContent; variant: string }) {
  const lines = String(c.code ?? "").replace(/\r/g, "").split("\n");
  return (
    <section id={id} className="site-section">
      <div className="site-container grid items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="site-heading text-3xl font-bold md:text-4xl">{c.title as string}</h2>
          <Paragraphs text={c.body} />
          {c.ctaLabel && (
            <a href={safeHref(c.ctaLink as string) || "#contact"} className="site-btn mt-8">{c.ctaLabel as string}</a>
          )}
        </div>
        <div className={`site-code site-code-${variant}`}>
          <div className="site-code-bar">
            <span /><span /><span />
            <em>{(c.filename as string) || "terminal"}</em>
          </div>
          <pre>
            {lines.map((l, i) => (
              <code key={i} className={l.trim().startsWith("#") || l.trim().startsWith("//") ? "is-comment" : l.startsWith("$") ? "is-cmd" : ""}>
                {l || " "}
                {"\n"}
              </code>
            ))}
          </pre>
        </div>
      </div>
    </section>
  );
}

function Logos({ id, c, items, variant }: { id: string; c: SectionContent; items: SectionItem[]; variant: string }) {
  const grid = variant === "grid";
  return (
    <section id={id} className={grid ? "site-section site-alt" : "site-logos"}>
      <div className="site-container">
        {grid ? <SectionHeader c={c} /> : c.title && <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[.18em] opacity-60">{c.title as string}</p>}
        <div className={grid ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" : "flex flex-wrap items-center justify-center gap-x-10 gap-y-4"}>
          {items.map((it, i) => (
            <div key={i} className={grid ? "site-card flex items-center justify-center !py-6" : ""}>
              {it.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt={it.title} className="h-8 w-auto opacity-70" />
              ) : (
                <span className="site-heading site-logo-word">{it.title}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta({ id, c, variant }: { id: string; c: SectionContent; variant: string }) {
  const inner = (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="site-heading text-3xl font-bold md:text-4xl">{c.title as string}</h2>
      {c.subtitle && <p className="mt-4 text-lg opacity-90">{c.subtitle as string}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {c.ctaLabel && <a href={safeHref(c.ctaLink as string) || "#contact"} className="site-btn">{c.ctaLabel as string}</a>}
        {c.secondaryLabel && <a href={safeHref(c.secondaryLink as string) || "#"} className="site-btn site-btn-line">{c.secondaryLabel as string}</a>}
      </div>
    </div>
  );
  if (variant === "card") {
    return (
      <section id={id} className="site-section">
        <div className="site-container">
          <div className="site-cta site-hero-dark site-rounded px-6 py-14 md:px-12">{inner}</div>
        </div>
      </section>
    );
  }
  return (
    <section id={id} className="site-cta site-hero-dark">
      <div className="site-container py-16 md:py-20">{inner}</div>
    </section>
  );
}

function Contact({
  id,
  c,
  brand,
  siteId,
  formType,
  variant,
  extraFields,
}: {
  id: string;
  c: SectionContent;
  brand: Brand;
  siteId: string;
  formType: string;
  variant: string;
  extraFields: ExtraField[];
}) {
  const form = (
    <div className="site-card">
      <h3 className="site-heading mb-4 text-xl font-semibold">{(c.formTitle as string) || "Get in touch"}</h3>
      <EnquiryForm
        siteId={siteId}
        formType={formType}
        buttonLabel={(c.buttonLabel as string) || "Submit"}
        messagePlaceholder={(c.messagePlaceholder as string) || "Message"}
        extraFields={extraFields}
      />
    </div>
  );
  if (variant === "centered") {
    return (
      <section id={id} className="site-section site-alt">
        <div className="site-container max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="site-heading text-3xl font-bold md:text-4xl">{c.title as string}</h2>
            {c.subtitle && <p className="mt-4 opacity-80">{c.subtitle as string}</p>}
          </div>
          {form}
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm opacity-80">
            {brand.phone && <span>{brand.phone}</span>}
            {brand.email && <span>{brand.email}</span>}
            {brand.address && <span>{brand.address}</span>}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id={id} className="site-section site-alt">
      <div className="site-container grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="site-heading text-3xl font-bold md:text-4xl">{c.title as string}</h2>
          {c.subtitle && <p className="mt-4 opacity-80">{c.subtitle as string}</p>}
          <dl className="mt-8 space-y-3 text-sm">
            {brand.address && (<div><dt className="font-semibold">Address</dt><dd className="opacity-80">{brand.address}</dd></div>)}
            {brand.phone && (<div><dt className="font-semibold">Phone</dt><dd className="opacity-80">{brand.phone}</dd></div>)}
            {brand.email && (<div><dt className="font-semibold">Email</dt><dd className="opacity-80">{brand.email}</dd></div>)}
          </dl>
        </div>
        {form}
      </div>
    </section>
  );
}

/** Theme-driven styles. Style variants (classic / modern / minimal) tweak the same building blocks. */
function SiteStyles() {
  return (
    <style>{`
      .site { background: var(--c-bg); color: var(--c-text); font-family: var(--f-body); }
      .site-heading { font-family: var(--f-heading); }
      .site-container { max-width: 1160px; margin: 0 auto; padding-left: 20px; padding-right: 20px; }
      .site-section { padding: var(--sp, 80px) 0; }
      .site section { scroll-margin-top: 72px; }
      .site-alt { background: var(--c-surface); }
      .site-rounded { border-radius: min(var(--radius), 24px); }
      .site-placeholder { background: linear-gradient(135deg, color-mix(in srgb, var(--c-primary) 75%, white), color-mix(in srgb, var(--c-secondary) 70%, white)); }
      .site-logo-mark { display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius: min(var(--radius), 12px); background: var(--c-primary); color:#fff; font-weight:700; font-family: var(--f-heading); }
      .site-btn { display:inline-block; background: var(--c-primary); color:#fff; padding: 12px 26px; border-radius: var(--radius); font-weight:600; transition: filter .15s; }
      .site-btn:hover { filter: brightness(1.1); }
      .site-btn-sm { padding: 8px 14px; font-size: 13px; }
      .site-price { font-family: var(--f-heading); font-weight: 700; font-size: 18px; color: var(--c-primary); }
      .site-wa-float { position: fixed; right: 20px; bottom: 20px; z-index: 40; width: 56px; height: 56px; border-radius: 999px; background: #25d366; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px -6px rgba(0,0,0,.35); }
      .site-minimal .site-card.overflow-hidden { border-width: 1px; padding: 0; }
      .site-card { background: var(--c-bg); border: 1px solid color-mix(in srgb, var(--c-text) 12%, transparent); border-radius: min(var(--radius), 24px); padding: 24px; }
      .site-meta { color: var(--c-primary); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
      .site-icon { border-radius: min(var(--radius), 14px); object-fit: cover; }
      .site-link { color: var(--c-primary); }
      .site-link:hover { text-decoration: underline; }
      .site-faq summary { list-style: none; display: flex; justify-content: space-between; gap: 16px; }
      .site-faq summary::-webkit-details-marker { display: none; }
      .site-faq summary::after { content: "+"; color: var(--c-primary); font-weight: 400; transition: transform .15s; }
      .site-faq[open] summary::after { transform: rotate(45deg); }
      .site-date { color: var(--c-primary); font-weight: 600; font-size: 14px; min-width: 110px; }
      .site-header { position: sticky; top: 0; z-index: 20; background: var(--c-bg); border-bottom: 1px solid color-mix(in srgb, var(--c-text) 10%, transparent); }
      .site-nav-link:hover { color: var(--c-primary); }
      .site-mobile-nav > summary { list-style: none; cursor: pointer; font-size: 22px; padding: 4px 8px; }
      .site-mobile-nav > summary::-webkit-details-marker { display: none; }
      .site-mobile-menu { position: absolute; left: 0; right: 0; top: 100%; background: var(--c-bg); color: var(--c-text); border-bottom: 1px solid color-mix(in srgb, var(--c-text) 12%, transparent); display: flex; flex-direction: column; padding: 8px 20px 16px; }
      .site-mobile-menu a { padding: 10px 0; font-weight: 500; border-bottom: 1px solid color-mix(in srgb, var(--c-text) 6%, transparent); }
      .site-hero { background: color-mix(in srgb, var(--c-primary) 6%, var(--c-bg)); }
      .site-stats { background: var(--c-primary); color: #fff; }
      .site-footer { background: color-mix(in srgb, var(--c-text) 92%, var(--c-primary)); color: #fff; }
      .site input, .site textarea, .site select { width:100%; border:1px solid color-mix(in srgb, var(--c-text) 20%, transparent); background: var(--c-bg); color: var(--c-text); border-radius: min(var(--radius), 12px); padding: 10px 12px; font-size: 14px; }
      .site input:focus, .site textarea:focus, .site select:focus { outline: 2px solid color-mix(in srgb, var(--c-primary) 40%, transparent); }

      /* Classic: solid primary header bar */
      .site-classic .site-header { background: var(--c-primary); color: #fff; border: 0; }
      .site-classic .site-logo-mark { background: #fff; color: var(--c-primary); }
      .site-classic .site-nav-link:hover { color: var(--c-secondary); }

      /* Modern: bold gradient hero, shadowed cards */
      .site-hero-dark { background: linear-gradient(135deg, var(--c-primary), color-mix(in srgb, var(--c-primary) 55%, var(--c-secondary))); color: #fff; }
      .site-hero-dark .site-btn { background: #fff; color: var(--c-primary); border-color: #fff; }
      .site-modern .site-card { border: 0; box-shadow: 0 10px 30px -12px color-mix(in srgb, var(--c-primary) 35%, transparent); }
      .site-modern .site-stats { background: var(--c-secondary); }

      /* Minimal: white space, thin rules, no fills */
      .site-minimal .site-hero { background: var(--c-bg); border-bottom: 1px solid color-mix(in srgb, var(--c-text) 10%, transparent); }
      .site-minimal .site-alt { background: var(--c-bg); border-top: 1px solid color-mix(in srgb, var(--c-text) 8%, transparent); }
      .site-minimal .site-card { border-width: 0 0 1px 0; border-radius: 0; padding: 20px 0; background: transparent; }
      .site-minimal .site-stats { background: var(--c-surface); color: var(--c-text); }
      .site-minimal .site-btn { background: transparent; color: var(--c-primary); border: 1.5px solid var(--c-primary); }
      .site-minimal .site-hero.site-hero-dark { border-bottom: 0; }

      /* ---- Page structure options (Design tab). Defaults above = original look. ---- */
      .site-dark .site-footer { background: color-mix(in srgb, var(--c-surface) 70%, #000); }
      .site-dark .site-header { border-bottom-color: color-mix(in srgb, var(--c-text) 14%, transparent); }

      .hdr-static .site-header { position: relative; }
      .site .site-hdr-btn { display: none; }
      @media (min-width: 768px) { .site .site-hdr-btn { display: inline-block; } }
      .site-mobile-menu .site-mobile-cta { color: var(--c-primary); font-weight: 700; border-bottom: 0; }
      .hdr-simple .site-header, .hdr-centered .site-header { background: var(--c-bg); color: var(--c-text); border-bottom: 1px solid color-mix(in srgb, var(--c-text) 10%, transparent); }
      .hdr-simple .site-logo-mark, .hdr-centered .site-logo-mark { background: var(--c-primary); color: #fff; }
      .hdr-simple .site-nav-link:hover, .hdr-centered .site-nav-link:hover { color: var(--c-primary); }
      .hdr-transparent .site-header { position: absolute; left: 0; right: 0; background: transparent; color: #fff; border: 0; }
      .hdr-transparent .site-logo-mark { background: #fff; color: var(--c-primary); }
      .hdr-transparent .site-nav-link:hover { color: #fff; opacity: .75; }
      .hdr-transparent .site-header .site-btn { background: #fff; color: var(--c-primary); border-color: #fff; }
      .hdr-transparent main > .site-hero:first-child .site-hero-pad { padding-top: 140px; }
      .hdr-transparent .site-mobile-menu { color: var(--c-text); }

      .site-hero-bg { position: relative; overflow: hidden; }
      .site-hero-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .site-hero-bg::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(2,6,23,.55), rgba(2,6,23,.7)); }
      .site-hero-bg > .site-container { z-index: 1; }

      .btn-solid .site-btn { background: var(--c-primary); color: #fff; border: 1.5px solid var(--c-primary); }
      .btn-outline .site-btn { background: transparent; color: var(--c-primary); border: 1.5px solid var(--c-primary); }
      .btn-soft .site-btn { background: color-mix(in srgb, var(--c-primary) 14%, transparent); color: var(--c-primary); border: 0; }
      .site .site-hero-dark .site-btn { background: #fff; color: var(--c-primary); border-color: #fff; }
      .btn-outline .site-hero-dark .site-btn { background: transparent; color: #fff; }
      .site .site-btn-line { background: transparent !important; color: inherit !important; border: 1.5px solid currentColor !important; }
      .site-btn-ghost { background: transparent !important; color: var(--c-primary) !important; border: 1.5px solid var(--c-primary) !important; }

      .site-stat-value { color: var(--c-primary); }
      .site-timeline { border-left: 2px solid color-mix(in srgb, var(--c-primary) 30%, transparent); margin-left: 8px; }
      .site-timeline-dot { position: absolute; left: -9px; top: 4px; width: 16px; height: 16px; border-radius: 999px; background: var(--c-primary); box-shadow: 0 0 0 4px var(--c-bg); }

      .site-plan { position: relative; padding: 32px 28px; }
      .site-plan-hot { border: 2px solid var(--c-primary) !important; box-shadow: 0 20px 40px -20px color-mix(in srgb, var(--c-primary) 60%, transparent); }
      .site-plan-badge { position: absolute; top: -12px; left: 28px; background: var(--c-primary); color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: .06em; }
      .site-check { color: var(--c-primary); font-weight: 700; }

      .site-code { border-radius: min(var(--radius), 18px); overflow: hidden; box-shadow: 0 24px 50px -24px rgba(2,6,23,.55); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13.5px; }
      .site-code-bar { display: flex; align-items: center; gap: 7px; padding: 12px 16px; }
      .site-code-bar span { width: 11px; height: 11px; border-radius: 99px; background: #f87171; }
      .site-code-bar span:nth-child(2) { background: #fbbf24; }
      .site-code-bar span:nth-child(3) { background: #34d399; }
      .site-code-bar em { margin-left: 10px; font-style: normal; font-size: 12px; opacity: .6; }
      .site-code pre { margin: 0; padding: 18px 20px 22px; overflow-x: auto; line-height: 1.75; }
      .site-code code { white-space: pre; }
      .site-code-terminal { background: #0b1220; color: #e2e8f0; }
      .site-code-terminal .site-code-bar { background: #151e31; }
      .site-code-terminal .is-cmd { color: #6ee7b7; }
      .site-code-editor { background: #fff; color: #0f172a; border: 1px solid color-mix(in srgb, var(--c-text) 12%, transparent); }
      .site-code-editor .site-code-bar { background: #f1f5f9; }
      .site-code-editor .is-cmd { color: var(--c-primary); font-weight: 600; }
      .site-code .is-comment { opacity: .5; }

      .site-logos { padding: 40px 0; border-bottom: 1px solid color-mix(in srgb, var(--c-text) 8%, transparent); }
      .site-logo-word { font-size: 20px; font-weight: 700; opacity: .55; letter-spacing: -.01em; }
      .site-cta { overflow: hidden; }
    `}</style>
  );
}

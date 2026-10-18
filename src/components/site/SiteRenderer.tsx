import type { CSSProperties } from "react";
import type { Brand, ModuleDef, SectionContent, SectionItem, Theme } from "@/modules/types";
import { fontCss, radiusCss } from "@/modules/shared";
import EnquiryForm from "./EnquiryForm";

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

export default function SiteRenderer({ siteId, module, enabledSections, theme, brand, sections }: Props) {
  const defs = module.sections.filter((s) => enabledSections.includes(s.key));
  const navItems = defs.filter((d) => d.kind !== "hero" && d.kind !== "stats");

  const vars = {
    "--c-primary": theme.primary,
    "--c-secondary": theme.secondary,
    "--c-bg": theme.background,
    "--c-surface": theme.surface,
    "--c-text": theme.text,
    "--f-heading": fontCss(theme.headingFont),
    "--f-body": fontCss(theme.bodyFont),
    "--radius": radiusCss(theme.radius),
  } as CSSProperties;

  return (
    <div style={vars} className={`site site-${theme.style} min-h-screen`} data-style={theme.style}>
      <link rel="stylesheet" href={googleFontsHref(theme)} precedence="default" />
      <SiteStyles />
      <header className="site-header">
        <div className="site-container flex items-center justify-between gap-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            {brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo} alt={brand.siteName} className="h-10 w-auto" />
            ) : (
              <span className="site-logo-mark">{brand.siteName.charAt(0)}</span>
            )}
            <span className="site-heading text-lg font-bold leading-tight">{brand.siteName}</span>
          </a>
          <nav className="hidden items-center gap-5 whitespace-nowrap text-sm font-medium md:flex">
            {navItems.map((d) => (
              <a key={d.key} href={`#${d.key}`} className="site-nav-link">
                {d.navLabel ?? d.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="top">
        {defs.map((def) => {
          const c = sections[def.key] ?? def.defaults;
          const items = (c.items as SectionItem[] | undefined) ?? [];
          switch (def.kind) {
            case "hero":
              return <Hero key={def.key} id={def.key} c={c} layout={theme.heroLayout} />;
            case "about":
              return <About key={def.key} id={def.key} c={c} />;
            case "stats":
              return <Stats key={def.key} id={def.key} items={items} />;
            case "cards":
              return <Cards key={def.key} id={def.key} c={c} items={items} />;
            case "list":
              return <List key={def.key} id={def.key} c={c} items={items} />;
            case "gallery":
              return <Gallery key={def.key} id={def.key} c={c} items={items} />;
            case "testimonials":
              return <Testimonials key={def.key} id={def.key} c={c} items={items} />;
            case "contact":
              return <Contact key={def.key} id={def.key} c={c} brand={brand} siteId={siteId} formType={def.key} />;
          }
        })}
      </main>

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
    </div>
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

function Hero({ id, c, layout }: { id: string; c: SectionContent; layout: Theme["heroLayout"] }) {
  const text = (
    <div className={layout === "centered" ? "mx-auto max-w-3xl text-center" : ""}>
      <h1 className="site-heading text-4xl font-bold leading-tight md:text-5xl">{c.headline as string}</h1>
      <p className="mt-5 text-lg opacity-85">{c.subheadline as string}</p>
      {c.ctaLabel && (
        <a href={(c.ctaLink as string) || "#contact"} className="site-btn mt-8">
          {c.ctaLabel as string}
        </a>
      )}
    </div>
  );
  return (
    <section id={id} className="site-hero">
      <div className="site-container py-20 md:py-28">
        {layout === "split" ? (
          <div className="grid items-center gap-12 md:grid-cols-2">
            {text}
            <ImageOrPlaceholder src={c.image as string} alt="" className="site-rounded aspect-[4/3] w-full" />
          </div>
        ) : (
          text
        )}
      </div>
    </section>
  );
}

function About({ id, c }: { id: string; c: SectionContent }) {
  return (
    <section id={id} className="site-section">
      <div className="site-container grid items-center gap-12 md:grid-cols-2">
        <ImageOrPlaceholder src={c.image as string} alt="" className="site-rounded aspect-[4/3] w-full" />
        <div>
          <h2 className="site-heading text-3xl font-bold md:text-4xl">{c.title as string}</h2>
          {String(c.body ?? "")
            .split(/\n+/)
            .filter(Boolean)
            .map((p, i) => (
              <p key={i} className="mt-4 leading-relaxed opacity-85">{p}</p>
            ))}
        </div>
      </div>
    </section>
  );
}

function Stats({ id, items }: { id: string; items: SectionItem[] }) {
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

function Cards({ id, c, items }: { id: string; c: SectionContent; items: SectionItem[] }) {
  return (
    <section id={id} className="site-section site-alt">
      <div className="site-container">
        <SectionHeader c={c} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <article key={i} className="site-card flex flex-col">
              {it.image && <ImageOrPlaceholder src={it.image} alt={it.title} className="site-rounded mb-4 aspect-video w-full" />}
              {it.meta && <p className="site-meta">{it.meta}</p>}
              <h3 className="site-heading mt-1 text-lg font-semibold">{it.title}</h3>
              {it.description && <p className="mt-2 text-sm leading-relaxed opacity-80">{it.description}</p>}
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

function List({ id, c, items }: { id: string; c: SectionContent; items: SectionItem[] }) {
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

function Gallery({ id, c, items }: { id: string; c: SectionContent; items: SectionItem[] }) {
  return (
    <section id={id} className="site-section site-alt">
      <div className="site-container">
        <SectionHeader c={c} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((it, i) => (
            <figure key={i}>
              <ImageOrPlaceholder src={it.image} alt={it.caption ?? ""} className="site-rounded aspect-square w-full" />
              {it.caption && <figcaption className="mt-2 text-sm opacity-75">{it.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ id, c, items }: { id: string; c: SectionContent; items: SectionItem[] }) {
  return (
    <section id={id} className="site-section">
      <div className="site-container">
        <SectionHeader c={c} />
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((it, i) => (
            <blockquote key={i} className="site-card">
              <p className="text-lg leading-relaxed">“{it.quote}”</p>
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

function Contact({ id, c, brand, siteId, formType }: { id: string; c: SectionContent; brand: Brand; siteId: string; formType: string }) {
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
        <div className="site-card">
          <h3 className="site-heading mb-4 text-xl font-semibold">{(c.formTitle as string) || "Get in touch"}</h3>
          <EnquiryForm siteId={siteId} formType={formType} buttonLabel={(c.buttonLabel as string) || "Submit"} />
        </div>
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
      .site-section { padding: 80px 0; }
      .site section { scroll-margin-top: 72px; }
      .site-alt { background: var(--c-surface); }
      .site-rounded { border-radius: min(var(--radius), 24px); }
      .site-placeholder { background: linear-gradient(135deg, color-mix(in srgb, var(--c-primary) 75%, white), color-mix(in srgb, var(--c-secondary) 70%, white)); }
      .site-logo-mark { display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius: min(var(--radius), 12px); background: var(--c-primary); color:#fff; font-weight:700; font-family: var(--f-heading); }
      .site-btn { display:inline-block; background: var(--c-primary); color:#fff; padding: 12px 26px; border-radius: var(--radius); font-weight:600; transition: filter .15s; }
      .site-btn:hover { filter: brightness(1.1); }
      .site-card { background: var(--c-bg); border: 1px solid color-mix(in srgb, var(--c-text) 12%, transparent); border-radius: min(var(--radius), 24px); padding: 24px; }
      .site-meta { color: var(--c-primary); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
      .site-date { color: var(--c-primary); font-weight: 600; font-size: 14px; min-width: 110px; }
      .site-header { position: sticky; top: 0; z-index: 20; background: var(--c-bg); border-bottom: 1px solid color-mix(in srgb, var(--c-text) 10%, transparent); }
      .site-nav-link:hover { color: var(--c-primary); }
      .site-hero { background: color-mix(in srgb, var(--c-primary) 6%, var(--c-bg)); }
      .site-stats { background: var(--c-primary); color: #fff; }
      .site-footer { background: color-mix(in srgb, var(--c-text) 92%, var(--c-primary)); color: #fff; }
      .site input, .site textarea { width:100%; border:1px solid color-mix(in srgb, var(--c-text) 20%, transparent); background: var(--c-bg); color: var(--c-text); border-radius: min(var(--radius), 12px); padding: 10px 12px; font-size: 14px; }
      .site input:focus, .site textarea:focus { outline: 2px solid color-mix(in srgb, var(--c-primary) 40%, transparent); }

      /* Classic: solid primary header bar */
      .site-classic .site-header { background: var(--c-primary); color: #fff; border: 0; }
      .site-classic .site-logo-mark { background: #fff; color: var(--c-primary); }
      .site-classic .site-nav-link:hover { color: var(--c-secondary); }

      /* Modern: bold gradient hero, shadowed cards */
      .site-modern .site-hero { background: linear-gradient(135deg, var(--c-primary), color-mix(in srgb, var(--c-primary) 55%, var(--c-secondary))); color: #fff; }
      .site-modern .site-hero .site-btn { background: #fff; color: var(--c-primary); }
      .site-modern .site-card { border: 0; box-shadow: 0 10px 30px -12px color-mix(in srgb, var(--c-primary) 35%, transparent); }
      .site-modern .site-stats { background: var(--c-secondary); }

      /* Minimal: white space, thin rules, no fills */
      .site-minimal .site-hero { background: var(--c-bg); border-bottom: 1px solid color-mix(in srgb, var(--c-text) 10%, transparent); }
      .site-minimal .site-alt { background: var(--c-bg); border-top: 1px solid color-mix(in srgb, var(--c-text) 8%, transparent); }
      .site-minimal .site-card { border-width: 0 0 1px 0; border-radius: 0; padding: 20px 0; background: transparent; }
      .site-minimal .site-stats { background: var(--c-surface); color: var(--c-text); }
      .site-minimal .site-btn { background: transparent; color: var(--c-primary); border: 1.5px solid var(--c-primary); }
    `}</style>
  );
}

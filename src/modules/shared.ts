import type { ButtonStyle, FieldDef, FontOption, FooterStyle, HeaderStyle, HeroLayout, Radius, SectionKind, Spacing, ThemeStyle } from "./types";

// Field sets reused by many sections across modules.

export const titleFields: FieldDef[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "subtitle", label: "Subtitle", type: "textarea" },
];

export const heroFields: FieldDef[] = [
  { key: "headline", label: "Headline", type: "text" },
  { key: "subheadline", label: "Sub-headline", type: "textarea" },
  { key: "ctaLabel", label: "Button text", type: "text" },
  { key: "ctaLink", label: "Button link", type: "text", placeholder: "#contact" },
  { key: "image", label: "Hero image URL", type: "image" },
];

export const aboutFields: FieldDef[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "body", label: "Text", type: "textarea" },
  { key: "image", label: "Image URL", type: "image" },
];

export const contactFields: FieldDef[] = [
  ...titleFields,
  { key: "formTitle", label: "Form heading", type: "text" },
  { key: "buttonLabel", label: "Submit button text", type: "text" },
  { key: "messagePlaceholder", label: "Message box hint", type: "text", placeholder: "Message" },
];

export const statItemFields: FieldDef[] = [
  { key: "value", label: "Number", type: "text" },
  { key: "label", label: "Label", type: "text" },
];

export const cardItemFields: FieldDef[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "meta", label: "Tag / role", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "image", label: "Image URL", type: "image" },
  { key: "icon", label: "Icon (small square image, optional)", type: "image" },
  { key: "link", label: "Button link (optional)", type: "url", placeholder: "https://…" },
  { key: "linkLabel", label: "Button text", type: "text", placeholder: "Visit site" },
];

export const faqItemFields: FieldDef[] = [
  { key: "question", label: "Question", type: "text" },
  { key: "answer", label: "Answer", type: "textarea" },
];

export const listItemFields: FieldDef[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "description", label: "Details", type: "textarea" },
];

export const galleryItemFields: FieldDef[] = [
  { key: "image", label: "Image URL", type: "image" },
  { key: "caption", label: "Caption", type: "text" },
];

export const productItemFields: FieldDef[] = [
  { key: "title", label: "Product name", type: "text" },
  { key: "category", label: "Category", type: "text" },
  { key: "price", label: "Price", type: "text", placeholder: "₹499" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "image", label: "Image URL", type: "image" },
];

export const testimonialItemFields: FieldDef[] = [
  { key: "quote", label: "Quote", type: "textarea" },
  { key: "name", label: "Name", type: "text" },
  { key: "role", label: "Role", type: "text" },
];

export const pricingItemFields: FieldDef[] = [
  { key: "title", label: "Plan name", type: "text" },
  { key: "price", label: "Price", type: "text", placeholder: "$29" },
  { key: "period", label: "Per", type: "text", placeholder: "/month" },
  { key: "description", label: "Short description", type: "text" },
  { key: "features", label: "Features (one per line)", type: "textarea" },
  { key: "ctaLabel", label: "Button text", type: "text" },
  { key: "ctaLink", label: "Button link", type: "text", placeholder: "#contact" },
  { key: "highlight", label: "Highlight this plan? (type yes)", type: "text", placeholder: "yes" },
];

export const codeFields: FieldDef[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "body", label: "Text beside the code", type: "textarea" },
  { key: "filename", label: "File / window name", type: "text", placeholder: "terminal" },
  { key: "code", label: "Code", type: "textarea" },
  { key: "ctaLabel", label: "Button text", type: "text" },
  { key: "ctaLink", label: "Button link", type: "text" },
];

export const logoItemFields: FieldDef[] = [
  { key: "title", label: "Name", type: "text" },
  { key: "image", label: "Logo image (optional)", type: "image" },
];

export const ctaFields: FieldDef[] = [
  { key: "title", label: "Headline", type: "text" },
  { key: "subtitle", label: "Text", type: "textarea" },
  { key: "ctaLabel", label: "Button text", type: "text" },
  { key: "ctaLink", label: "Button link", type: "text", placeholder: "#contact" },
  { key: "secondaryLabel", label: "Second button text (optional)", type: "text" },
  { key: "secondaryLink", label: "Second button link", type: "text" },
];

// Style options offered in the builder.

export const FONTS: FontOption[] = [
  { name: "Inter", css: "'Inter', sans-serif" },
  { name: "Poppins", css: "'Poppins', sans-serif" },
  { name: "Montserrat", css: "'Montserrat', sans-serif" },
  { name: "Open Sans", css: "'Open Sans', sans-serif" },
  { name: "Roboto", css: "'Roboto', sans-serif" },
  { name: "Lato", css: "'Lato', sans-serif" },
  { name: "Playfair Display", css: "'Playfair Display', serif" },
  { name: "Merriweather", css: "'Merriweather', serif" },
  { name: "Lora", css: "'Lora', serif" },
  { name: "DM Serif Display", css: "'DM Serif Display', serif" },
];

export const RADIUS_OPTIONS: { value: Radius; label: string; css: string }[] = [
  { value: "none", label: "Square", css: "0px" },
  { value: "sm", label: "Small", css: "4px" },
  { value: "md", label: "Medium", css: "10px" },
  { value: "lg", label: "Large", css: "18px" },
  { value: "full", label: "Pill", css: "999px" },
];

export const STYLE_OPTIONS: { value: ThemeStyle; label: string; description: string }[] = [
  { value: "classic", label: "Classic", description: "Solid header, bordered cards" },
  { value: "modern", label: "Modern", description: "Bold colors, soft shadows" },
  { value: "minimal", label: "Minimal", description: "Lots of white space, thin lines" },
];

export const HERO_LAYOUTS: { value: HeroLayout; label: string }[] = [
  { value: "centered", label: "Centered" },
  { value: "split", label: "Text + image side by side" },
  { value: "split-reverse", label: "Image + text (image left)" },
  { value: "background", label: "Full-width background image" },
];

export const HEADER_OPTIONS: { value: HeaderStyle; label: string }[] = [
  { value: "auto", label: "Follow layout style" },
  { value: "simple", label: "Simple (logo left, menu right)" },
  { value: "centered", label: "Centered (logo above menu)" },
  { value: "transparent", label: "Transparent over the hero" },
  { value: "none", label: "No header" },
];

export const FOOTER_OPTIONS: { value: FooterStyle; label: string }[] = [
  { value: "columns", label: "Three columns" },
  { value: "simple", label: "Single line" },
  { value: "none", label: "No footer" },
];

export const SPACING_OPTIONS: { value: Spacing; label: string; px: number }[] = [
  { value: "compact", label: "Compact", px: 52 },
  { value: "normal", label: "Normal", px: 80 },
  { value: "airy", label: "Airy", px: 112 },
];

export const BUTTON_OPTIONS: { value: ButtonStyle; label: string }[] = [
  { value: "auto", label: "Follow layout style" },
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "soft", label: "Soft tint" },
];

/** Layout variants each section kind supports. The first one is the default (today's look). */
export const SECTION_VARIANTS: Partial<Record<SectionKind, { value: string; label: string }[]>> = {
  about: [
    { value: "image-left", label: "Image left" },
    { value: "image-right", label: "Image right" },
    { value: "centered", label: "Centered text" },
  ],
  stats: [
    { value: "band", label: "Coloured band" },
    { value: "cards", label: "Cards" },
  ],
  cards: [
    { value: "grid", label: "Grid" },
    { value: "list", label: "List rows" },
    { value: "alternating", label: "Alternating image / text" },
  ],
  list: [
    { value: "cards", label: "Cards" },
    { value: "timeline", label: "Timeline" },
  ],
  gallery: [
    { value: "grid", label: "3-column grid" },
    { value: "wide", label: "2-column wide" },
  ],
  testimonials: [
    { value: "grid", label: "Grid" },
    { value: "single", label: "One big quote per row" },
  ],
  faq: [
    { value: "accordion", label: "Accordion" },
    { value: "two-column", label: "Two columns, always open" },
  ],
  contact: [
    { value: "split", label: "Details + form" },
    { value: "centered", label: "Form only, centered" },
  ],
  code: [
    { value: "terminal", label: "Terminal (dark)" },
    { value: "editor", label: "Light editor" },
  ],
  logos: [
    { value: "row", label: "One row" },
    { value: "grid", label: "Grid of tiles" },
  ],
  cta: [
    { value: "band", label: "Full-width band" },
    { value: "card", label: "Card" },
  ],
};

export function sectionVariant(kind: SectionKind, stored: string | undefined) {
  const opts = SECTION_VARIANTS[kind];
  if (!opts) return "";
  return opts.some((o) => o.value === stored) ? (stored as string) : opts[0].value;
}

export function fontCss(name: string) {
  return FONTS.find((f) => f.name === name)?.css ?? `'${name}', sans-serif`;
}

export function radiusCss(r: Radius) {
  return RADIUS_OPTIONS.find((o) => o.value === r)?.css ?? "10px";
}

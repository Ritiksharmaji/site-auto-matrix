import type { FieldDef, FontOption, Radius, ThemeStyle, HeroLayout } from "./types";

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
];

export function fontCss(name: string) {
  return FONTS.find((f) => f.name === name)?.css ?? `'${name}', sans-serif`;
}

export function radiusCss(r: Radius) {
  return RADIUS_OPTIONS.find((o) => o.value === r)?.css ?? "10px";
}

// Shared types for the module system.
//
// A module (School, Company, ...) is pure configuration: a list of sections,
// each built from a reusable section "kind" with its own fields and default
// content, plus theme presets. Adding a new industry module means adding a
// new config file, not new rendering code.

export type FieldType = "text" | "textarea" | "image" | "url" | "date";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
};

/** Reusable building blocks that the site renderer knows how to draw. */
export type SectionKind =
  | "hero"
  | "about"
  | "stats"
  | "cards"
  | "list"
  | "gallery"
  | "testimonials"
  | "contact";

export type SectionDef = {
  key: string;
  label: string;
  /** Short label for the site menu (defaults to label). */
  navLabel?: string;
  description: string;
  kind: SectionKind;
  /** Required sections cannot be turned off in the builder. */
  required?: boolean;
  /** On by default when a new site is created. */
  defaultEnabled?: boolean;
  /** Top-level fields of the section (title, subtitle, ...). */
  fields: FieldDef[];
  /** Fields of each repeated item (cards, list rows, gallery images...). */
  itemFields?: FieldDef[];
  itemLabel?: string;
  defaults: SectionContent;
};

export type SectionItem = Record<string, string>;
export type SectionContent = Record<string, string | SectionItem[]> & {
  items?: SectionItem[];
};

export type FontOption = { name: string; css: string };

export type ThemeStyle = "classic" | "modern" | "minimal";
export type HeroLayout = "centered" | "split";
export type Radius = "none" | "sm" | "md" | "lg" | "full";

export type Theme = {
  preset: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  headingFont: string;
  bodyFont: string;
  radius: Radius;
  style: ThemeStyle;
  heroLayout: HeroLayout;
};

export type ThemePreset = { key: string; label: string; theme: Omit<Theme, "preset"> };

export type Brand = {
  siteName: string;
  tagline: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  footerText: string;
};

export type SiteContent = { brand: Brand } & Record<string, SectionContent | Brand>;

export type ModuleDef = {
  key: string;
  name: string;
  description: string;
  sections: SectionDef[];
  presets: ThemePreset[];
  defaultBrand: Brand;
};

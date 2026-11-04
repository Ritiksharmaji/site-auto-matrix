import { artUrl } from "@/lib/art";
import type { SectionItem, Theme } from "@/modules/types";

// Small helpers that keep the blueprint files readable.

/** Artwork in a blueprint's own colours. */
export function art(a: string, b: string) {
  return {
    hero: (scene: string, g: string, s = 1) => artUrl("hero", { a, b, scene, g, s }),
    photo: (g: string, s = 1) => artUrl("photo", { a, b, g, s }),
    icon: (g: string) => artUrl("icon", { a, b, g }),
    avatar: (s = 1) => artUrl("avatar", { a, b, s }),
  };
}
export type Art = ReturnType<typeof art>;

/**
 * A bundled stock photo (public/blueprints/photos/<name>.webp). The list of photos,
 * with their Unsplash IDs, is in scripts/blueprint-photos.txt.
 */
export const pic = (name: string) => `/blueprints/photos/${name}.webp`;

type ThemeInput = Omit<Theme, "preset"> & { preset?: string };

/** Fills page-structure defaults so every blueprint stores a complete theme. */
export function theme(t: ThemeInput): Theme {
  return {
    preset: "custom",
    header: "auto",
    headerSticky: true,
    headerCta: false,
    footer: "columns",
    spacing: "normal",
    buttonStyle: "auto",
    variants: {},
    ...t,
  };
}

export const feature = (A: Art, g: string, title: string, description: string, meta = ""): SectionItem => ({ title, meta, description, image: "", icon: A.icon(g) });
export const card = (title: string, description: string, image = "", meta = ""): SectionItem => ({ title, meta, description, image });
export const person = (photo: string, title: string, meta: string, description = ""): SectionItem => ({ title, meta, description, image: pic(photo) });
export const stat = (value: string, label: string): SectionItem => ({ value, label });
export const faq = (question: string, answer: string): SectionItem => ({ question, answer });
export const quote = (q: string, name: string, role: string): SectionItem => ({ quote: q, name, role });
export const row = (title: string, description: string, date = ""): SectionItem => ({ title, date, description });
export const logos = (...names: string[]): SectionItem[] => names.map((title) => ({ title, image: "" }));
export const shot = (photo: string, caption: string): SectionItem => ({ image: pic(photo), caption });
export const product = (photo: string, title: string, category: string, price: string, description: string): SectionItem => ({
  title, category, price, description, image: pic(photo),
});
export const link = (title: string, description: string, href: string, linkLabel: string, A?: Art, g?: string): SectionItem => ({
  title, description, link: href, linkLabel, meta: "", image: "", icon: A && g ? A.icon(g) : "",
});
export function plan(title: string, price: string, period: string, description: string, features: string[], ctaLabel: string, highlight = false): SectionItem {
  return { title, price, period, description, features: features.join("\n"), ctaLabel, ctaLink: "#contact", highlight: highlight ? "yes" : "" };
}

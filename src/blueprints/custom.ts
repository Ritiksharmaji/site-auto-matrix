import { theme } from "./kit";
import type { Blueprint } from "./types";

// Bare starting points: neutral colours, few sections, module default text.
// Pick one, then shape header, sections, layouts and style in the Design tab.

const neutral = {
  primary: "#334155", secondary: "#64748b", background: "#ffffff", surface: "#f8fafc", text: "#0f172a",
  headingFont: "Inter", bodyFont: "Inter", radius: "md" as const, style: "minimal" as const, heroLayout: "centered" as const,
};

export const CUSTOM_BLUEPRINTS: Blueprint[] = [
  {
    key: "custom-landing",
    name: "Blank landing page",
    category: "custom",
    description: "Hero, features, call to action and contact. Neutral styling, ready to design from scratch.",
    tags: ["Blank", "One page"],
    moduleKey: "tech",
    theme: theme({ ...neutral, header: "simple", footer: "simple" }),
    sections: ["hero", "features", "cta", "contact"],
    brand: { siteName: "Your brand", tagline: "Your one-line pitch", email: "", phone: "", address: "", footerText: "" },
    content: {},
  },
  {
    key: "custom-business",
    name: "Blank business site",
    category: "custom",
    description: "Hero, about, services and contact on the business module. Neutral styling.",
    tags: ["Blank", "Business"],
    moduleKey: "company",
    theme: theme({ ...neutral, heroLayout: "split", header: "simple" }),
    sections: ["hero", "about", "services", "contact"],
    brand: { siteName: "Your business", tagline: "What you do, in one line", email: "", phone: "", address: "", footerText: "" },
    content: {},
  },
  {
    key: "custom-no-header",
    name: "Single-screen page (no header)",
    category: "custom",
    description: "No header or menu, just a hero and a form. Good for campaigns and event sign-ups.",
    tags: ["Blank", "Campaign"],
    moduleKey: "company",
    theme: theme({ ...neutral, style: "modern", heroLayout: "centered", header: "none", footer: "simple", variants: { contact: "centered" } }),
    sections: ["hero", "contact"],
    brand: { siteName: "Your campaign", tagline: "", email: "", phone: "", address: "", footerText: "" },
    content: {
      hero: { headline: "Your campaign headline", subheadline: "One sentence about the offer and why it matters.", ctaLabel: "Register now", ctaLink: "#contact", image: "" },
      contact: { title: "Register your interest", subtitle: "Leave your details and we'll be in touch.", formTitle: "Register", buttonLabel: "Register" },
    },
  },
];

import type { Brand, SectionContent, Theme } from "@/modules/types";

// A blueprint is a ready-made website: a module + the sections it uses (in order)
// + a full design (theme and page structure) + finished demo content and artwork.
// Creating a site from a blueprint copies all of it; the client then only swaps
// the text and images.

export type BlueprintCategory = "tech" | "business" | "shop" | "school" | "university" | "custom";

export const BLUEPRINT_CATEGORIES: { key: BlueprintCategory; label: string; description: string }[] = [
  { key: "tech", label: "Tech / DevOps", description: "Docker, Kubernetes, cloud, CI/CD, APIs, SaaS and dev tools" },
  { key: "business", label: "Business / Agency", description: "Consulting, agencies, professional services, clinics" },
  { key: "shop", label: "Shop / E-commerce", description: "Fashion, grocery, electronics, cafés, gifts" },
  { key: "school", label: "School", description: "Pre-schools, K-12, heritage schools" },
  { key: "university", label: "University / Coaching", description: "Colleges, business schools, coaching institutes" },
  { key: "custom", label: "Custom starters", description: "Bare starting points to design your own layout in the Design tab" },
];

export type Blueprint = {
  key: string;
  name: string;
  category: BlueprintCategory;
  description: string;
  /** Short labels shown on the gallery card. */
  tags: string[];
  moduleKey: string;
  theme: Theme;
  /** Enabled sections, in the order they appear. */
  sections: string[];
  brand: Partial<Brand>;
  /** Per-section content, merged over the module defaults (items replace the default list). */
  content: Record<string, Partial<SectionContent>>;
};

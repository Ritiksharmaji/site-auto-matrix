import { art, faq, feature, person, quote, stat, theme } from "./kit";
import type { Blueprint } from "./types";

// Business / agency blueprints on the "company" module.

const northstar = (() => {
  const A = art("1e3a8a", "b8860b");
  return {
    key: "business-consulting",
    name: "Northstar – Strategy consulting",
    category: "business",
    description: "Elegant serif design for consultants and advisory firms.",
    tags: ["Consulting", "Elegant", "Serif"],
    moduleKey: "company",
    theme: theme({
      primary: "#1e3a8a", secondary: "#b8860b", background: "#fbfaf7", surface: "#f2efe8", text: "#14182b",
      headingFont: "Playfair Display", bodyFont: "Lato", radius: "none", style: "minimal", heroLayout: "split",
      header: "simple", spacing: "airy", variants: { services: "list", testimonials: "single", about: "image-right" },
    }),
    sections: ["hero", "about", "stats", "services", "whyus", "testimonials", "faq", "contact"],
    brand: { siteName: "Northstar Advisory", tagline: "Strategy for ambitious companies", email: "partners@northstar.in", phone: "+91 22 4000 1234", address: "Nariman Point, Mumbai", footerText: "Northstar Advisory LLP" },
    content: {
      hero: { headline: "Clarity for your next big decision", subheadline: "Growth strategy, market entry and operating models for founders and boards.", ctaLabel: "Schedule a conversation", ctaLink: "#contact", image: A.hero("showcase", "chart", 2) },
      about: { title: "Senior advisors, hands-on work", body: "Northstar was founded by former partners of global consulting firms. We take on a small number of clients so a partner leads every engagement.\n\nOur work has guided 60+ companies through fundraising, expansion and turnaround.", image: A.photo("users", 3) },
      stats: { items: [stat("60+", "Companies advised"), stat("₹4,000 Cr", "Capital raised by clients"), stat("15", "Industries"), stat("92%", "Repeat clients")] },
      services: {
        title: "How we help",
        items: [
          feature(A, "chart", "Growth strategy", "Where to play and how to win, backed by data.", "Strategy"),
          feature(A, "globe", "Market entry", "Enter new cities, countries or segments with a tested plan.", "Expansion"),
          feature(A, "gear", "Operating model", "Org design, processes and KPIs that scale.", "Operations"),
          feature(A, "trophy", "Fundraising readiness", "Investor narrative, model and data room.", "Capital"),
        ],
      },
      whyus: {
        title: "Why Northstar",
        items: [
          feature(A, "users", "Partner-led", "A senior partner on every project, start to finish."),
          feature(A, "check", "Outcome-based fees", "Part of our fee is tied to agreed results."),
          feature(A, "clock", "Fast", "Clear recommendations in weeks, not quarters."),
        ],
      },
      testimonials: { title: "Client words", items: [quote("Northstar gave our board the clarity to enter two new markets. Both are profitable today.", "R. Iyer", "Managing Director, Coastal Foods")] },
      faq: { title: "Questions", items: [faq("What size of company do you work with?", "Typically ₹20 Cr to ₹2,000 Cr in revenue."), faq("How long is an engagement?", "Most run 6 to 12 weeks.")] },
      contact: { title: "Start a conversation", subtitle: "Tell us about the decision in front of you.", formTitle: "Contact a partner" },
    },
  } satisfies Blueprint;
})();

const pixelpine = (() => {
  const A = art("db2777", "7c3aed");
  return {
    key: "business-creative-agency",
    name: "Pixel & Pine – Creative agency",
    category: "business",
    description: "Bold, colourful agency site with a portfolio and a team section.",
    tags: ["Agency", "Portfolio", "Colourful"],
    moduleKey: "company",
    theme: theme({
      primary: "#db2777", secondary: "#7c3aed", background: "#ffffff", surface: "#fdf2f8", text: "#1f1530",
      headingFont: "Poppins", bodyFont: "Inter", radius: "full", style: "modern", heroLayout: "split",
      header: "transparent", headerCta: true, variants: { portfolio: "alternating", contact: "centered" },
    }),
    sections: ["hero", "services", "portfolio", "stats", "team", "testimonials", "contact"],
    brand: { siteName: "Pixel & Pine", tagline: "Brand, web and social for bold companies", email: "hello@pixelandpine.studio", phone: "+91 90000 12345", address: "Indiranagar, Bengaluru", footerText: "Pixel & Pine Studio" },
    content: {
      hero: { headline: "We make brands impossible to ignore", subheadline: "Branding, websites and social content for companies that want to stand out.", ctaLabel: "Start a project", ctaLink: "#contact", image: A.hero("showcase", "pen", 3) },
      services: {
        title: "What we do",
        items: [
          feature(A, "pen", "Brand identity", "Logos, colour and voice that people remember."),
          feature(A, "code", "Websites", "Fast, beautiful sites that convert."),
          feature(A, "camera", "Social content", "Reels, posts and campaigns every month."),
          feature(A, "chart", "Performance ads", "Meta and Google ads that pay for themselves."),
        ],
      },
      portfolio: {
        title: "Selected work",
        items: [
          { title: "Chai Point rebrand", meta: "Branding", description: "A warmer identity for 120 cafés, rolled out in 8 weeks.", image: A.photo("coffee", 4) },
          { title: "FitBox launch", meta: "Website + social", description: "D2C launch that sold out the first batch in 3 days.", image: A.photo("dumbbell", 5) },
          { title: "Greenleaf annual report", meta: "Editorial", description: "Interactive report read by 40,000 stakeholders.", image: A.photo("leaf", 6) },
        ],
      },
      stats: { items: [stat("140+", "Brands launched"), stat("12", "Awards"), stat("3.2×", "Avg. ROAS"), stat("9", "Years")] },
      team: { title: "The crew", items: [person(A, 1, "Ria Kapoor", "Creative Director"), person(A, 2, "Dev Malhotra", "Design Lead"), person(A, 3, "Sana Qureshi", "Strategy"), person(A, 4, "Arun Pillai", "Tech Lead")] },
      testimonials: { title: "Kind words", items: [quote("They understood our brand better than we did.", "Meghna Rao", "Founder, FitBox"), quote("On time, on budget and genuinely creative.", "Rohan Das", "Marketing Head, Chai Point")] },
      contact: { title: "Got a project?", subtitle: "Tell us about it. We reply within a day.", formTitle: "Start a project" },
    },
  } satisfies Blueprint;
})();

const mehta = (() => {
  const A = art("7f1d1d", "ca8a04");
  return {
    key: "business-law-firm",
    name: "Mehta & Associates – Law / CA firm",
    category: "business",
    description: "Traditional, trustworthy design for law firms, CAs and professional services.",
    tags: ["Legal", "Classic", "Serif"],
    moduleKey: "company",
    theme: theme({
      primary: "#7f1d1d", secondary: "#ca8a04", background: "#ffffff", surface: "#faf6f0", text: "#1c1917",
      headingFont: "DM Serif Display", bodyFont: "Lato", radius: "none", style: "classic", heroLayout: "split",
      header: "centered", variants: { services: "list", faq: "two-column" },
    }),
    sections: ["hero", "about", "services", "team", "stats", "faq", "contact"],
    brand: { siteName: "Mehta & Associates", tagline: "Advocates & Legal Consultants since 1994", email: "office@mehtaassociates.in", phone: "+91 11 2345 6789", address: "Connaught Place, New Delhi", footerText: "Mehta & Associates" },
    content: {
      hero: { headline: "Sound legal counsel, for three decades", subheadline: "Corporate, property, family and tax matters handled with care and discretion.", ctaLabel: "Book a consultation", ctaLink: "#contact", image: A.hero("showcase", "scale", 4) },
      about: { title: "About the firm", body: "Founded in 1994 by Sr. Advocate R. K. Mehta, the firm represents individuals and companies before the Supreme Court, High Courts and tribunals.\n\nOur team of 14 advocates and chartered accountants offers legal and tax advice under one roof.", image: A.photo("building", 5) },
      services: {
        title: "Practice areas",
        items: [
          feature(A, "building", "Corporate & commercial", "Contracts, compliance, M&A and disputes."),
          feature(A, "home", "Property & real estate", "Title checks, registration and RERA matters."),
          feature(A, "users", "Family law", "Divorce, custody, succession and wills."),
          feature(A, "scale", "Tax & GST", "Advisory, filings and appeals."),
        ],
      },
      team: { title: "Our advocates", items: [person(A, 1, "R. K. Mehta", "Senior Advocate"), person(A, 2, "Anjali Mehta", "Partner, Corporate"), person(A, 3, "Sanjay Arora", "CA, Tax & GST")] },
      stats: { items: [stat("30", "Years"), stat("5,000+", "Matters handled"), stat("14", "Advocates & CAs"), stat("3", "Offices")] },
      faq: {
        title: "Common questions",
        items: [
          faq("How do I book a consultation?", "Use the form below or call the office. First consultations are 45 minutes."),
          faq("Do you offer online consultations?", "Yes, by video call for clients anywhere in India."),
          faq("What are your fees?", "Fees depend on the matter. We share a written estimate before starting."),
          faq("Is my information confidential?", "Always. Everything you share is protected by advocate–client privilege."),
        ],
      },
      contact: { title: "Book a consultation", subtitle: "Share a few details and our office will call you back.", formTitle: "Request a call back" },
    },
  } satisfies Blueprint;
})();

const buildright = (() => {
  const A = art("ea580c", "334155");
  return {
    key: "business-construction",
    name: "BuildRight – Construction & interiors",
    category: "business",
    description: "Strong, photo-led design for builders, architects and interior designers.",
    tags: ["Construction", "Projects", "Bold"],
    moduleKey: "company",
    theme: theme({
      primary: "#ea580c", secondary: "#334155", background: "#ffffff", surface: "#f8f7f5", text: "#1c1917",
      headingFont: "Montserrat", bodyFont: "Open Sans", radius: "sm", style: "classic", heroLayout: "background",
      header: "transparent", headerCta: true, buttonStyle: "solid",
    }),
    sections: ["hero", "stats", "services", "portfolio", "whyus", "testimonials", "contact"],
    brand: { siteName: "BuildRight Constructions", tagline: "Homes and offices, built to last", email: "enquiry@buildright.in", phone: "+91 98220 33445", address: "Baner, Pune", footerText: "BuildRight Constructions Pvt Ltd" },
    content: {
      hero: { headline: "From plan to keys, on time", subheadline: "Turnkey construction and interiors for homes, villas and offices across Pune.", ctaLabel: "Get a free estimate", ctaLink: "#contact", image: A.hero("plain", "home", 5) },
      stats: { items: [stat("350+", "Projects delivered"), stat("18", "Years"), stat("1.2M", "Sq. ft. built"), stat("100%", "On-time handover")] },
      services: {
        title: "Services",
        items: [
          feature(A, "home", "Residential construction", "Independent homes and villas, design to handover."),
          feature(A, "building", "Commercial projects", "Offices, showrooms and warehouses."),
          feature(A, "pen", "Interior design", "Modular kitchens, wardrobes and full interiors."),
          feature(A, "wrench", "Renovation", "Structural repairs, extensions and makeovers."),
        ],
      },
      portfolio: {
        title: "Recent projects",
        items: [
          { title: "Green Meadows Villas", meta: "Residential · 24 villas", description: "", image: A.photo("home", 6) },
          { title: "Techpark Office Fit-out", meta: "Commercial · 40,000 sq ft", description: "", image: A.photo("building", 7) },
          { title: "Lakeview Penthouse", meta: "Interiors", description: "", image: A.photo("pen", 8) },
        ],
      },
      whyus: {
        title: "Why BuildRight",
        items: [
          feature(A, "check", "Fixed-price contracts", "No surprise costs halfway through."),
          feature(A, "clock", "Weekly progress reports", "Photos and updates every Friday."),
          feature(A, "shield", "10-year structural warranty", "We stand behind what we build."),
        ],
      },
      testimonials: { title: "Happy homeowners", items: [quote("They handed over our home two weeks early. The quality is excellent.", "Prakash & Meera Joshi", "Villa owners, Baner"), quote("Our office fit-out finished over a long weekend. Zero downtime.", "Nitin Shah", "Director, Shah Infotech")] },
      contact: { title: "Plan your project", subtitle: "Share your plot size and requirements for a free estimate.", formTitle: "Get a free estimate" },
    },
  } satisfies Blueprint;
})();

const careplus = (() => {
  const A = art("0d9488", "0ea5e9");
  return {
    key: "business-clinic",
    name: "CarePlus – Clinic & healthcare",
    category: "business",
    description: "Calm, clean design for clinics, dentists and diagnostic centres.",
    tags: ["Healthcare", "Clinic", "Soft"],
    moduleKey: "company",
    theme: theme({
      primary: "#0d9488", secondary: "#0ea5e9", background: "#ffffff", surface: "#f0fbfa", text: "#0f2a2a",
      headingFont: "Poppins", bodyFont: "Open Sans", radius: "lg", style: "modern", heroLayout: "split",
      header: "simple", headerCta: true, buttonStyle: "solid",
    }),
    sections: ["hero", "services", "about", "team", "stats", "testimonials", "faq", "contact"],
    brand: { siteName: "CarePlus Clinic", tagline: "Family healthcare, close to home", email: "appointments@careplus.clinic", phone: "+91 80 4000 5678", address: "HSR Layout, Bengaluru", footerText: "CarePlus Multispeciality Clinic", whatsapp: "" },
    content: {
      hero: { headline: "Caring for your family, every day", subheadline: "General medicine, dental, eye care and diagnostics under one roof. Same-day appointments.", ctaLabel: "Book an appointment", ctaLink: "#contact", image: A.hero("showcase", "heart", 6) },
      services: {
        title: "Our services",
        items: [
          feature(A, "heart", "General medicine", "Check-ups, fevers, diabetes and BP care."),
          feature(A, "tooth", "Dental care", "Cleaning, fillings, braces and implants."),
          feature(A, "eye", "Eye care", "Eye tests, glasses and cataract consults."),
          feature(A, "flask", "Diagnostics", "Blood tests and reports on your phone the same day."),
        ],
      },
      about: { title: "A clinic that listens", body: "CarePlus was started by a group of doctors who wanted unhurried, honest care. Every appointment gives you real time with your doctor.", image: A.photo("heart", 3) },
      team: { title: "Our doctors", items: [person(A, 1, "Dr. Kavita Rao", "MBBS, MD – General Medicine"), person(A, 2, "Dr. Imran Ali", "BDS, MDS – Dental"), person(A, 3, "Dr. Neha Joshi", "MS – Ophthalmology")] },
      stats: { items: [stat("25,000+", "Patients"), stat("12", "Specialists"), stat("7 days", "Open a week"), stat("4.8★", "Google rating")] },
      testimonials: { title: "Patient stories", items: [quote("The doctors take time to explain everything. We've been coming for years.", "Sunita M.", "Patient"), quote("Booked in the morning and seen by lunch. Very clean and friendly.", "Arjun P.", "Patient")] },
      faq: { title: "FAQs", items: [faq("Do I need an appointment?", "Walk-ins are welcome, but booking saves waiting time."), faq("Do you accept insurance?", "Yes, most major insurers for diagnostics and procedures.")] },
      contact: { title: "Book an appointment", subtitle: "We'll call to confirm a time that suits you.", formTitle: "Appointment request", buttonLabel: "Request appointment" },
    },
  } satisfies Blueprint;
})();

export const BUSINESS_BLUEPRINTS: Blueprint[] = [northstar, pixelpine, mehta, buildright, careplus];

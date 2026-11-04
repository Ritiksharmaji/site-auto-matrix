import { art, pic, faq, feature, link, logos, plan, quote, row, stat, theme } from "./kit";
import type { Blueprint } from "./types";

// Ten developer-first blueprints on the "tech" module. Each has its own look
// (colours, fonts, header, hero, section layouts) and finished content.

const shipcrate = (() => {
  const A = art("3b82f6", "22d3ee");
  return {
    key: "tech-container-registry",
    name: "ShipCrate – Container registry",
    category: "tech",
    description: "Dark, Docker-style product site for a container registry or image hosting service.",
    tags: ["Docker", "Dark", "Pricing"],
    moduleKey: "tech",
    theme: theme({
      primary: "#3b82f6", secondary: "#22d3ee", background: "#0b1020", surface: "#10172c", text: "#e2e8f0",
      headingFont: "Inter", bodyFont: "Inter", radius: "md", style: "modern", heroLayout: "split",
      header: "transparent", headerCta: true, variants: { code: "terminal", stats: "cards" },
    }),
    sections: ["hero", "logos", "features", "code", "stats", "pricing", "testimonials", "faq", "cta", "contact"],
    brand: { siteName: "ShipCrate", tagline: "Private container registry for fast teams", email: "hello@shipcrate.io", footerText: "ShipCrate Labs" },
    content: {
      hero: {
        headline: "Your containers, shipped everywhere",
        subheadline: "A private Docker registry with vulnerability scanning, global replication and pulls that never slow your CI.",
        ctaLabel: "Start free", ctaLink: "#pricing", image: pic("t-server-cables"),
      },
      logos: { title: "Pulling 3 billion layers a month for", items: logos("Kubeship", "Dockyard", "Nimbus", "Harbor & Co", "CloudNine") },
      features: {
        title: "A registry built for CI/CD", subtitle: "Push once, pull fast from any region.",
        items: [
          feature(A, "box", "OCI & Docker compatible", "Works with docker, podman, buildx and every OCI tool you already use."),
          feature(A, "shield", "Built-in scanning", "Every image is scanned for CVEs on push, with fix suggestions."),
          feature(A, "globe", "Geo-replication", "Images replicate to 12 regions so pulls stay under a second."),
          feature(A, "lock", "Fine-grained access", "Robot accounts, SSO and per-repository permissions."),
          feature(A, "bolt", "Layer caching", "Smart deduplication cuts storage and egress costs."),
          feature(A, "pulse", "Usage insights", "See who pulls what, when and from where."),
        ],
      },
      code: {
        title: "Push your first image in 30 seconds", body: "Log in with the Docker CLI you already have. No agents, no plugins.",
        filename: "bash", code: "$ docker login registry.shipcrate.io\n$ docker tag api:latest registry.shipcrate.io/acme/api:1.4\n$ docker push registry.shipcrate.io/acme/api:1.4\n# ✔ Scanned: 0 critical, 0 high", ctaLabel: "Read the docs", ctaLink: "#contact",
      },
      stats: { items: [stat("3B+", "Layers pulled / month"), stat("12", "Global regions"), stat("99.99%", "Uptime SLA"), stat("<1s", "Median pull")] },
      pricing: {
        title: "Pay for storage, not seats", subtitle: "Unlimited users on every plan.",
        items: [
          plan("Starter", "$0", "/month", "For side projects", ["5 GB storage", "Unlimited public repos", "Community support"], "Start free"),
          plan("Team", "$49", "/month", "For growing teams", ["100 GB storage", "Vulnerability scanning", "3 regions", "Email support"], "Start trial", true),
          plan("Enterprise", "Custom", "", "For regulated industries", ["Unlimited storage", "All 12 regions", "SSO & audit logs", "24/7 support"], "Talk to sales"),
        ],
      },
      testimonials: {
        title: "Teams ship faster with ShipCrate",
        items: [
          quote("Our CI pull times dropped from 90 seconds to 6. It paid for itself in a week.", "Rohit Bansal", "Platform Lead, Ledgerly"),
          quote("Scanning on push caught two critical CVEs before they reached production.", "Sara Thomas", "Security Engineer, Medibox"),
        ],
      },
      faq: {
        title: "Questions, answered",
        items: [
          faq("Do I need to change my Dockerfiles?", "No. ShipCrate is a standard OCI registry; only the image name changes."),
          faq("Can I mirror Docker Hub?", "Yes. Pull-through caching mirrors any public registry and avoids rate limits."),
          faq("Where is my data stored?", "You choose a primary region. Replication to other regions is optional."),
        ],
      },
      cta: { title: "Stop waiting on image pulls", subtitle: "Free for 5 GB. No credit card.", ctaLabel: "Create a registry", ctaLink: "#contact", secondaryLabel: "Talk to sales", secondaryLink: "#contact" },
      contact: { title: "Talk to an engineer", subtitle: "Migrating from Docker Hub, ECR or GCR? We'll help you move.", formTitle: "Request a demo" },
    },
  } satisfies Blueprint;
})();

const helmsman = (() => {
  return {
    key: "tech-kubernetes",
    name: "Helmsman – Kubernetes platform",
    category: "tech",
    description: "Clean, light site for a Kubernetes management or platform-engineering product.",
    tags: ["Kubernetes", "Light", "Timeline"],
    moduleKey: "tech",
    theme: theme({
      primary: "#326ce5", secondary: "#7c3aed", background: "#ffffff", surface: "#f3f6fd", text: "#0f172a",
      headingFont: "Poppins", bodyFont: "Inter", radius: "lg", style: "classic", heroLayout: "split-reverse",
      header: "simple", headerCta: true, variants: { features: "alternating", howitworks: "timeline", code: "editor" },
    }),
    sections: ["hero", "logos", "features", "howitworks", "code", "pricing", "faq", "contact"],
    brand: { siteName: "Helmsman", tagline: "Kubernetes without the 3 a.m. pages", email: "team@helmsman.dev", footerText: "Helmsman Inc." },
    content: {
      hero: {
        headline: "Kubernetes, finally boring",
        subheadline: "One control plane for every cluster. Deploy, upgrade and secure workloads across clouds from a single dashboard.",
        ctaLabel: "Book a demo", ctaLink: "#contact", image: pic("t-server-aisle"),
      },
      logos: { title: "Running 9,000+ clusters for", items: logos("Fleetbase", "Orbital", "Paysure", "Quanta", "Routely") },
      features: {
        title: "Built for platform teams",
        items: [
          { title: "Multi-cluster in one view", meta: "Fleet", description: "EKS, GKE, AKS and on-prem clusters side by side, with health and cost per namespace.", image: pic("t-monitoring") },
          { title: "Safe upgrades", meta: "Lifecycle", description: "Pre-flight checks flag deprecated APIs before you upgrade, then roll nodes with zero downtime.", image: pic("t-server-tech") },
          { title: "Policy guardrails", meta: "Security", description: "Ship OPA policies to every cluster and block risky deployments automatically.", image: pic("t-sec-lock") },
        ],
      },
      howitworks: {
        title: "Live in an afternoon",
        items: [
          row("Install the agent", "One Helm chart per cluster. Read-only by default."),
          row("Import your workloads", "Helmsman discovers deployments, services and Helm releases."),
          row("Set your guardrails", "Pick policies and upgrade windows; we do the rest."),
        ],
      },
      code: {
        title: "One command per cluster", body: "The agent connects outbound only, so there's nothing to open in your firewall.",
        filename: "install.sh", code: "$ helm repo add helmsman https://charts.helmsman.dev\n$ helm install helmsman-agent helmsman/agent \\\n    --set token=$HELMSMAN_TOKEN\n# cluster \"prod-ap-south\" connected ✔",
        ctaLabel: "See the docs", ctaLink: "#contact",
      },
      pricing: {
        title: "Priced per cluster", subtitle: "",
        items: [
          plan("Team", "$99", "/cluster/mo", "Up to 10 clusters", ["Fleet dashboard", "Upgrade checks", "Slack alerts"], "Start trial", true),
          plan("Enterprise", "Custom", "", "Unlimited clusters", ["Policy engine", "SSO & RBAC", "Air-gapped install", "Named support engineer"], "Contact sales"),
        ],
      },
      faq: {
        title: "FAQs",
        items: [
          faq("Does Helmsman replace kubectl?", "No. Keep using your tools; Helmsman adds visibility, policy and safe upgrades on top."),
          faq("Which distributions are supported?", "Any CNCF-conformant Kubernetes 1.26 or newer, including k3s and OpenShift."),
        ],
      },
      contact: { title: "See Helmsman on your clusters", subtitle: "30-minute demo with a platform engineer.", formTitle: "Book a demo" },
    },
  } satisfies Blueprint;
})();

const piperocket = (() => {
  const A = art("f97316", "8b5cf6");
  return {
    key: "tech-cicd",
    name: "PipeRocket – CI/CD pipelines",
    category: "tech",
    description: "Energetic orange site for a CI/CD or build-automation product with integrations.",
    tags: ["CI/CD", "Integrations", "Bold"],
    moduleKey: "tech",
    theme: theme({
      primary: "#f97316", secondary: "#8b5cf6", background: "#ffffff", surface: "#fff7f0", text: "#1c1917",
      headingFont: "Montserrat", bodyFont: "Inter", radius: "md", style: "modern", heroLayout: "split",
      header: "simple", headerCta: true, buttonStyle: "solid", variants: { integrations: "grid" },
    }),
    sections: ["hero", "logos", "features", "code", "stats", "integrations", "pricing", "testimonials", "cta", "contact"],
    brand: { siteName: "PipeRocket", tagline: "CI/CD that keeps up with you", email: "hi@piperocket.dev", footerText: "PipeRocket" },
    content: {
      hero: {
        headline: "Green builds in half the time",
        subheadline: "Parallel pipelines, smart caching and one-click rollbacks. From commit to production in minutes.",
        ctaLabel: "Try it free", ctaLink: "#pricing", image: pic("t-office-devs"),
      },
      logos: { title: "Shipping 400k builds a day for", items: logos("Trellis", "Fabrikam", "Hooli", "Vandelay", "Stark Ind.") },
      features: {
        title: "Pipelines without the pain",
        items: [
          feature(A, "bolt", "Smart caching", "Dependencies and Docker layers are cached across runs automatically."),
          feature(A, "branch", "Branch previews", "Every pull request gets a live preview environment."),
          feature(A, "layers", "Parallel jobs", "Split test suites across 50 runners with one line."),
          feature(A, "rocket", "One-click deploys", "Promote builds between environments with approvals."),
          feature(A, "clock", "Rollbacks in seconds", "Every deploy is versioned. Roll back without a rebuild."),
          feature(A, "eye", "Flaky test detection", "We spot and quarantine flaky tests before they block you."),
        ],
      },
      code: {
        title: "Pipelines as simple YAML", body: "Drop a file in your repo. PipeRocket figures out the rest.",
        filename: ".piperocket.yml", code: "pipeline:\n  - test:\n      run: npm test\n      parallel: 8\n  - build:\n      docker: ./Dockerfile\n  - deploy:\n      to: production\n      approve: true",
        ctaLabel: "Explore examples", ctaLink: "#contact",
      },
      stats: { items: [stat("2.3×", "Faster builds"), stat("400k", "Builds a day"), stat("50", "Parallel runners"), stat("99.95%", "Uptime")] },
      integrations: { title: "Plugs into your stack", items: logos("GitHub", "GitLab", "Bitbucket", "Docker", "Kubernetes", "AWS", "Slack", "Jira", "Terraform", "Sentry", "Datadog", "Vercel") },
      pricing: {
        title: "Pricing that scales with your team",
        items: [
          plan("Free", "$0", "/month", "For individuals", ["2,000 build minutes", "2 parallel jobs", "Community support"], "Start free"),
          plan("Team", "$15", "/user/mo", "For product teams", ["Unlimited minutes", "20 parallel jobs", "Preview environments"], "Start trial", true),
          plan("Scale", "Custom", "", "For large orgs", ["Self-hosted runners", "SSO", "Dedicated support"], "Contact sales"),
        ],
      },
      testimonials: {
        title: "Developers love it",
        items: [
          quote("We cut our test suite from 22 minutes to 7 by turning on parallelism. One line of YAML.", "Vikram Sethi", "Engineering Manager, Cartly"),
          quote("Preview environments changed how our designers review work.", "Pooja Nair", "Head of Product, Draftbox"),
        ],
      },
      cta: { title: "Your next build could be your fastest", subtitle: "2,000 free minutes every month.", ctaLabel: "Start building", ctaLink: "#contact", secondaryLabel: "Compare plans", secondaryLink: "#pricing" },
      contact: { title: "Let's speed up your pipeline", subtitle: "Tell us about your stack and we'll suggest a setup.", formTitle: "Talk to us" },
    },
  } satisfies Blueprint;
})();

const nimbus = (() => {
  const A = art("0ea5e9", "14b8a6");
  return {
    key: "tech-cloud-hosting",
    name: "NimbusHost – Cloud & VPS hosting",
    category: "tech",
    description: "Hosting company site with a full-width hero, price plans and a two-column FAQ.",
    tags: ["Hosting", "VPS", "Pricing"],
    moduleKey: "tech",
    theme: theme({
      primary: "#0ea5e9", secondary: "#14b8a6", background: "#ffffff", surface: "#f0f9ff", text: "#0c1b2a",
      headingFont: "Poppins", bodyFont: "Open Sans", radius: "lg", style: "classic", heroLayout: "background",
      header: "transparent", headerCta: true, variants: { stats: "cards", faq: "two-column", contact: "centered" },
    }),
    sections: ["hero", "features", "pricing", "stats", "testimonials", "faq", "contact"],
    brand: { siteName: "NimbusHost", tagline: "Fast NVMe cloud servers in India", email: "support@nimbushost.in", footerText: "NimbusHost Cloud Pvt Ltd" },
    content: {
      hero: {
        headline: "Cloud servers that just work",
        subheadline: "NVMe VPS in Mumbai, Delhi and Singapore. Deploy in 55 seconds, from ₹399 a month.",
        ctaLabel: "See plans", ctaLink: "#pricing", image: pic("t-server-fans"),
      },
      features: {
        title: "Everything included",
        items: [
          feature(A, "bolt", "NVMe storage", "Up to 10× faster than SATA SSD."),
          feature(A, "shield", "DDoS protection", "Always-on mitigation at no extra cost."),
          feature(A, "database", "Daily backups", "Automatic snapshots kept for 7 days."),
          feature(A, "globe", "3 regions", "Low latency across India and South-East Asia."),
        ],
      },
      pricing: {
        title: "Simple monthly pricing", subtitle: "No hidden fees. Cancel anytime.",
        items: [
          plan("Starter", "₹399", "/month", "1 vCPU · 1 GB RAM", ["25 GB NVMe", "1 TB bandwidth", "1 IPv4"], "Deploy now"),
          plan("Business", "₹1,299", "/month", "2 vCPU · 4 GB RAM", ["80 GB NVMe", "4 TB bandwidth", "Free backups"], "Deploy now", true),
          plan("Performance", "₹3,499", "/month", "4 vCPU · 8 GB RAM", ["160 GB NVMe", "8 TB bandwidth", "Priority support"], "Deploy now"),
        ],
      },
      stats: { title: "Trusted infrastructure", items: [stat("55s", "Average deploy"), stat("99.99%", "Network uptime"), stat("25k", "Servers running"), stat("24/7", "Human support")] },
      testimonials: {
        title: "Customers stay with us",
        items: [
          quote("Moved our WooCommerce stores here. Page loads dropped by half.", "Aman Gupta", "Founder, Kraftly"),
          quote("Support answered at 2 a.m. in four minutes. Real engineers.", "Divya S.", "Freelance developer"),
        ],
      },
      faq: {
        title: "Hosting FAQs",
        items: [
          faq("Is root access included?", "Yes, every server comes with full root access."),
          faq("Can I upgrade later?", "Resize up any time with a reboot; your data stays."),
          faq("Do you offer managed servers?", "Yes. Add managed support to any plan."),
          faq("Which OS can I install?", "Ubuntu, Debian, Rocky, AlmaLinux or your own ISO."),
        ],
      },
      contact: { title: "Need a custom setup?", subtitle: "Dedicated servers, private networks or bulk pricing: tell us what you need.", formTitle: "Get a quote" },
    },
  } satisfies Blueprint;
})();

const relay = (() => {
  const A = art("8b5cf6", "ec4899");
  return {
    key: "tech-api-platform",
    name: "Relay – API platform",
    category: "tech",
    description: "Dark violet site for an API product with code samples, docs links and a changelog.",
    tags: ["API", "Dark", "Docs"],
    moduleKey: "tech",
    theme: theme({
      primary: "#8b5cf6", secondary: "#ec4899", background: "#0f0a1e", surface: "#171030", text: "#ede9fe",
      headingFont: "Inter", bodyFont: "Inter", radius: "md", style: "modern", heroLayout: "split",
      header: "simple", footer: "simple", variants: { features: "list", changelog: "timeline", cta: "card" },
    }),
    sections: ["hero", "code", "features", "docs", "pricing", "changelog", "cta", "contact"],
    brand: { siteName: "Relay", tagline: "Messaging APIs for developers", email: "devs@relayapi.io", footerText: "Relay API" },
    content: {
      hero: {
        headline: "SMS, WhatsApp and email. One API.",
        subheadline: "Send messages on every channel with a single endpoint, delivery webhooks and SDKs for 7 languages.",
        ctaLabel: "Get an API key", ctaLink: "#contact", image: pic("t-code-js"),
      },
      code: {
        title: "Send your first message", body: "One request. Relay routes it over the cheapest reliable channel and tells you when it lands.",
        filename: "curl", code: "$ curl https://api.relayapi.io/v1/messages \\\n  -H \"Authorization: Bearer $RELAY_KEY\" \\\n  -d to=+919876543210 \\\n  -d channel=whatsapp \\\n  -d text=\"Your order has shipped\"\n# { \"id\": \"msg_8Fz2\", \"status\": \"queued\" }",
        ctaLabel: "API reference", ctaLink: "#docs",
      },
      features: {
        title: "Why developers pick Relay",
        items: [
          feature(A, "plug", "One endpoint, every channel", "Switch SMS to WhatsApp by changing one field."),
          feature(A, "pulse", "Delivery webhooks", "Signed events for sent, delivered, read and failed."),
          feature(A, "code", "SDKs you'll like", "Typed SDKs for Node, Python, Go, Java, PHP, Ruby and .NET."),
          feature(A, "lock", "Secure by default", "Scoped keys, IP allow-lists and full audit logs."),
        ],
      },
      docs: {
        title: "Docs & resources",
        items: [
          link("Quick start", "Send a message in under 5 minutes.", "#", "Start", A, "rocket"),
          link("API reference", "Every endpoint, parameter and error code.", "#", "Open", A, "book"),
          link("Status page", "Live uptime and incident history.", "#", "View", A, "pulse"),
        ],
      },
      pricing: {
        title: "Pay as you go",
        items: [
          plan("Developer", "Free", "", "For testing", ["1,000 free messages", "Sandbox numbers", "All SDKs"], "Get a key"),
          plan("Growth", "₹0.18", "/message", "Volume pricing", ["All channels", "Delivery webhooks", "Email support"], "Start now", true),
          plan("Enterprise", "Custom", "", "High volume", ["Dedicated numbers", "99.99% SLA", "Solution engineer"], "Contact sales"),
        ],
      },
      changelog: {
        title: "Changelog",
        items: [
          row("WhatsApp templates API", "Create and submit templates programmatically.", "2026-10-28"),
          row("Go SDK v2", "Context support and typed errors.", "2026-10-02"),
          row("Webhook retries", "Exponential backoff for up to 24 hours.", "2026-09-15"),
        ],
      },
      cta: { title: "Build with Relay today", subtitle: "1,000 free messages to start.", ctaLabel: "Get an API key", ctaLink: "#contact", secondaryLabel: "Read the docs", secondaryLink: "#docs" },
      contact: { title: "Talk to us", subtitle: "Need higher limits or a custom contract?", formTitle: "Contact sales" },
    },
  } satisfies Blueprint;
})();

const forgekit = (() => {
  const A = art("16a34a", "0ea5e9");
  return {
    key: "tech-open-source-cli",
    name: "Forgekit – Open-source CLI",
    category: "tech",
    description: "Minimal, compact page for an open-source developer tool: terminal first, docs and releases.",
    tags: ["Open source", "Minimal", "CLI"],
    moduleKey: "tech",
    theme: theme({
      primary: "#16a34a", secondary: "#0ea5e9", background: "#fbfdfb", surface: "#f0f7f2", text: "#0c1a12",
      headingFont: "Montserrat", bodyFont: "Roboto", radius: "sm", style: "minimal", heroLayout: "centered",
      header: "simple", footer: "simple", spacing: "compact", buttonStyle: "outline", variants: { changelog: "timeline", code: "terminal" },
    }),
    sections: ["hero", "code", "features", "docs", "changelog", "faq", "cta", "contact"],
    brand: { siteName: "forgekit", tagline: "Scaffold, lint and release from one CLI", email: "maintainers@forgekit.dev", footerText: "forgekit · MIT licence" },
    content: {
      hero: {
        headline: "One CLI for your whole repo",
        subheadline: "forgekit scaffolds projects, runs your linters and cuts releases. Free and open source, MIT licensed.",
        ctaLabel: "Star on GitHub", ctaLink: "https://github.com", image: "",
      },
      code: {
        title: "Install in one line", body: "Works on macOS, Linux and Windows. No runtime needed: it's a single binary.",
        filename: "zsh", code: "$ brew install forgekit\n$ forge new api --template go-service\n$ forge check\n# ✔ 0 lint errors · 142 tests passed\n$ forge release minor\n# ✔ v1.7.0 tagged and published",
        ctaLabel: "Installation guide", ctaLink: "#docs",
      },
      features: {
        title: "What it does",
        items: [
          feature(A, "terminal", "Templates", "Start new services from shared templates in seconds."),
          feature(A, "check", "One check command", "Lint, format and test with the right tools per language."),
          feature(A, "branch", "Releases", "Semantic versions, changelogs and tags generated for you."),
        ],
      },
      docs: {
        title: "Docs",
        items: [
          link("Getting started", "Install and create your first project.", "#", "Read"),
          link("Templates", "Write and share your own templates.", "#", "Read"),
          link("GitHub", "Source, issues and discussions.", "https://github.com", "Open"),
        ],
      },
      changelog: {
        title: "Releases",
        items: [
          row("v1.7.0", "Windows ARM builds and faster template rendering.", "2026-10-30"),
          row("v1.6.0", "New `forge doctor` command.", "2026-09-12"),
          row("v1.5.0", "Monorepo support.", "2026-08-01"),
        ],
      },
      faq: {
        title: "FAQ",
        items: [
          faq("Is it really free?", "Yes. forgekit is MIT licensed. Companies can sponsor development on GitHub."),
          faq("How do I contribute?", "Pick an issue labelled “good first issue” and open a pull request."),
        ],
      },
      cta: { title: "Give forgekit a try", subtitle: "Join 4,000+ developers on GitHub.", ctaLabel: "Star on GitHub", ctaLink: "https://github.com", secondaryLabel: "Read the docs", secondaryLink: "#docs" },
      contact: { title: "Sponsorship & support", subtitle: "Commercial support and training for teams.", formTitle: "Get in touch" },
    },
  } satisfies Blueprint;
})();

const pulsewatch = (() => {
  const A = art("e11d48", "f59e0b");
  return {
    key: "tech-monitoring",
    name: "Pulsewatch – Monitoring & observability",
    category: "tech",
    description: "Dashboard-style product site for monitoring, logging or uptime tools.",
    tags: ["Monitoring", "Dashboard", "SaaS"],
    moduleKey: "tech",
    theme: theme({
      primary: "#e11d48", secondary: "#f59e0b", background: "#ffffff", surface: "#fff5f6", text: "#18181b",
      headingFont: "Inter", bodyFont: "Inter", radius: "md", style: "classic", heroLayout: "split",
      header: "simple", headerCta: true, variants: { testimonials: "single", integrations: "grid" },
    }),
    sections: ["hero", "logos", "stats", "features", "integrations", "pricing", "testimonials", "faq", "contact"],
    brand: { siteName: "Pulsewatch", tagline: "Know before your users do", email: "hello@pulsewatch.io", footerText: "Pulsewatch Analytics" },
    content: {
      hero: {
        headline: "See every incident before your customers do",
        subheadline: "Metrics, logs, traces and uptime checks in one place, with alerts that wake the right person.",
        ctaLabel: "Start 14-day trial", ctaLink: "#pricing", image: pic("t-analytics"),
      },
      logos: { title: "Watching production for", items: logos("Zestify", "Payflow", "Quickcart", "Learnly", "Medix") },
      stats: { items: [stat("4.2B", "Events / day"), stat("30s", "Check interval"), stat("18", "Probe locations"), stat("3 min", "Avg. time to alert")] },
      features: {
        title: "Full-stack observability",
        items: [
          feature(A, "pulse", "Uptime checks", "HTTP, TCP, DNS and cron monitors from 18 locations."),
          feature(A, "chart", "Metrics", "Prometheus-compatible, with 13 months retention."),
          feature(A, "book", "Logs", "Search a billion lines in under a second."),
          feature(A, "branch", "Traces", "OpenTelemetry tracing across every service."),
          feature(A, "bolt", "Smart alerts", "Grouping and on-call routing to Slack, SMS and phone."),
          feature(A, "globe", "Status pages", "Branded public status pages, updated automatically."),
        ],
      },
      integrations: { title: "Integrations", items: logos("OpenTelemetry", "Prometheus", "Kubernetes", "AWS", "PagerDuty", "Slack") },
      pricing: {
        title: "Plans",
        items: [
          plan("Startup", "$39", "/month", "Small teams", ["50 monitors", "10 GB logs", "Email + Slack alerts"], "Start trial"),
          plan("Business", "$149", "/month", "Growing products", ["500 monitors", "100 GB logs", "Traces", "On-call scheduling"], "Start trial", true),
          plan("Enterprise", "Custom", "", "At scale", ["Unlimited monitors", "SSO & audit", "Dedicated cluster"], "Contact sales"),
        ],
      },
      testimonials: {
        title: "Customer stories",
        items: [quote("We found a memory leak that had been costing us ₹2 lakh a month in servers. In the first week.", "Neeraj Kulkarni", "VP Engineering, Quickcart")],
      },
      faq: {
        title: "FAQs",
        items: [
          faq("Do you support OpenTelemetry?", "Yes. Send OTLP data directly; no proprietary agent required."),
          faq("How long is data kept?", "Metrics 13 months, logs 30 days, traces 15 days. Longer on request."),
        ],
      },
      contact: { title: "Get a guided trial", subtitle: "We'll help you set up your first dashboards.", formTitle: "Talk to us" },
    },
  } satisfies Blueprint;
})();

const sentinel = (() => {
  return {
    key: "tech-devsecops",
    name: "Sentinel Scan – DevSecOps security",
    category: "tech",
    description: "Dark security product site with scan output in a terminal and alternating features.",
    tags: ["Security", "Dark", "Terminal"],
    moduleKey: "tech",
    theme: theme({
      primary: "#10b981", secondary: "#06b6d4", background: "#0a0f1c", surface: "#0f1729", text: "#e5e7eb",
      headingFont: "Montserrat", bodyFont: "Inter", radius: "sm", style: "modern", heroLayout: "split",
      header: "simple", headerCta: true, variants: { features: "alternating", code: "terminal", cta: "card", stats: "cards" },
    }),
    sections: ["hero", "logos", "code", "features", "stats", "pricing", "faq", "cta", "contact"],
    brand: { siteName: "Sentinel Scan", tagline: "Security that runs in your pipeline", email: "security@sentinelscan.io", footerText: "Sentinel Security Labs" },
    content: {
      hero: {
        headline: "Find vulnerabilities before attackers do",
        subheadline: "Scan code, dependencies, containers and cloud configs on every commit. Fixes arrive as pull requests.",
        ctaLabel: "Scan your repo free", ctaLink: "#contact", image: pic("t-sec-person"),
      },
      logos: { title: "Protecting code at", items: logos("Securepay", "Healthstack", "Kredit", "Govtech", "Insurely") },
      code: {
        title: "Results in your terminal", body: "Run it locally or in CI. Clear findings, ranked by real risk.",
        filename: "sentinel", code: "$ sentinel scan .\n# scanning 1,284 files, 312 dependencies, 2 images…\n✖ CRITICAL  log4j-core 2.14  CVE-2021-44228\n✖ HIGH      exposed AWS key in config/dev.env\n✔ fix PR opened: #482 bump log4j-core → 2.17.2",
        ctaLabel: "Try the CLI", ctaLink: "#contact",
      },
      features: {
        title: "Shift security left",
        items: [
          { title: "Dependency scanning", meta: "SCA", description: "Known CVEs in 12 package ecosystems, with reachable-code analysis to cut noise.", image: pic("t-code-react") },
          { title: "Secrets detection", meta: "Secrets", description: "Catch keys and tokens before they're pushed, with pre-commit hooks.", image: pic("t-sec-lock2") },
          { title: "Container & IaC", meta: "Cloud", description: "Scan Docker images, Terraform and Kubernetes manifests for misconfigurations.", image: pic("t-server-green") },
        ],
      },
      stats: { items: [stat("12", "Ecosystems"), stat("90%", "Less alert noise"), stat("<60s", "Average scan"), stat("SOC 2", "Type II")] },
      pricing: {
        title: "Plans",
        items: [
          plan("Open source", "Free", "", "Public repos", ["Unlimited scans", "Fix PRs", "Community support"], "Start free"),
          plan("Team", "$25", "/dev/mo", "Private repos", ["All scanners", "CI integrations", "Policy as code"], "Start trial", true),
          plan("Enterprise", "Custom", "", "Compliance", ["SBOM exports", "SSO & audit", "On-prem option"], "Contact sales"),
        ],
      },
      faq: {
        title: "FAQs",
        items: [
          faq("Does my code leave my network?", "Not with the CLI or self-hosted runner. Only findings are uploaded."),
          faq("Which CI systems do you support?", "GitHub Actions, GitLab CI, Jenkins, Bitbucket and any shell-based CI."),
        ],
      },
      cta: { title: "Secure your next release", subtitle: "Free for open source. 14-day trial for teams.", ctaLabel: "Start scanning", ctaLink: "#contact", secondaryLabel: "Book a demo", secondaryLink: "#contact" },
      contact: { title: "Talk to a security engineer", subtitle: "Questions about compliance or deployment? We can help.", formTitle: "Contact us" },
    },
  } satisfies Blueprint;
})();

const metricly = (() => {
  const A = art("4f46e5", "06b6d4");
  return {
    key: "tech-saas-analytics",
    name: "Metricly – SaaS analytics",
    category: "tech",
    description: "Friendly SaaS landing page with pill buttons, dashboard art and a call-to-action card.",
    tags: ["SaaS", "Startup", "Light"],
    moduleKey: "tech",
    theme: theme({
      primary: "#4f46e5", secondary: "#06b6d4", background: "#ffffff", surface: "#f5f6ff", text: "#1e1b4b",
      headingFont: "Poppins", bodyFont: "Inter", radius: "full", style: "modern", heroLayout: "split",
      header: "simple", headerCta: true, spacing: "airy", variants: { cta: "card", stats: "cards" },
    }),
    sections: ["hero", "logos", "features", "stats", "testimonials", "pricing", "faq", "cta", "contact"],
    brand: { siteName: "Metricly", tagline: "Product analytics for growing teams", email: "hello@metricly.app", footerText: "Metricly" },
    content: {
      hero: {
        headline: "Understand every user, without SQL",
        subheadline: "Funnels, retention and revenue dashboards that set themselves up. Add one script and get answers today.",
        ctaLabel: "Start free trial", ctaLink: "#pricing", image: pic("t-charts"),
      },
      logos: { title: "Helping 2,000+ product teams", items: logos("Notely", "Swiftpay", "Hireloop", "Fitbite", "Tutorly") },
      features: {
        title: "Answers in minutes",
        items: [
          feature(A, "chart", "Funnels", "See exactly where users drop off and why."),
          feature(A, "users", "Cohorts & retention", "Compare groups over time with one click."),
          feature(A, "sparkle", "AI insights", "Plain-English summaries of what changed this week."),
        ],
      },
      stats: { items: [stat("2,000+", "Teams"), stat("5 min", "Setup"), stat("40%", "Avg. lift in activation"), stat("GDPR", "Compliant")] },
      testimonials: {
        title: "Teams grow with Metricly",
        items: [
          quote("We found our activation drop-off on day one and fixed it in a sprint.", "Ishita Paul", "PM, Hireloop"),
          quote("Finally analytics my whole team actually opens.", "Sameer Khan", "CEO, Fitbite"),
        ],
      },
      pricing: {
        title: "Plans for every stage",
        items: [
          plan("Free", "$0", "/month", "Up to 10k events", ["Core dashboards", "1 project", "7-day history"], "Start free"),
          plan("Growth", "$59", "/month", "Up to 1M events", ["Funnels & cohorts", "AI insights", "Unlimited history"], "Start trial", true),
          plan("Business", "$249", "/month", "Up to 20M events", ["Warehouse sync", "SSO", "Priority support"], "Talk to us"),
        ],
      },
      faq: {
        title: "FAQs",
        items: [
          faq("Will it slow my site down?", "No. The script is 4 KB and loads asynchronously."),
          faq("Can I export my data?", "Yes, to CSV or directly to BigQuery, Snowflake or Postgres."),
        ],
      },
      cta: { title: "See your first insight today", subtitle: "Free 14-day trial of Growth. No card needed.", ctaLabel: "Start free trial", ctaLink: "#contact", secondaryLabel: "Watch a demo", secondaryLink: "#contact" },
      contact: { title: "Questions?", subtitle: "Our team replies within a few hours.", formTitle: "Send us a message" },
    },
  } satisfies Blueprint;
})();

const opscraft = (() => {
  const A = art("0f766e", "f59e0b");
  return {
    key: "tech-devops-agency",
    name: "OpsCraft – DevOps consultancy",
    category: "tech",
    description: "Service business site for a DevOps / cloud consulting agency: services, process and case results.",
    tags: ["Agency", "Services", "Process"],
    moduleKey: "tech",
    theme: theme({
      primary: "#0f766e", secondary: "#f59e0b", background: "#ffffff", surface: "#f0f8f7", text: "#10201e",
      headingFont: "Montserrat", bodyFont: "Lato", radius: "sm", style: "classic", heroLayout: "split",
      headerCta: true, variants: { about: "image-right", howitworks: "timeline", features: "grid" },
    }),
    sections: ["hero", "logos", "features", "about", "stats", "howitworks", "testimonials", "faq", "contact"],
    brand: { siteName: "OpsCraft Studio", tagline: "DevOps & cloud consulting", email: "projects@opscraft.studio", phone: "+91 98111 22334", address: "Pune, India", footerText: "OpsCraft Studio LLP" },
    content: {
      hero: {
        headline: "Cloud infrastructure, done right",
        subheadline: "We design, migrate and run AWS, Azure and Kubernetes setups for growing companies, so your developers can just ship.",
        ctaLabel: "Book a free audit", ctaLink: "#contact", image: pic("t-team-smile"),
      },
      logos: { title: "Infrastructure partners for", items: logos("Zippy", "EduNext", "Finvest", "Shopwise", "Caremate") },
      features: {
        title: "What we do",
        items: [
          feature(A, "cloud", "Cloud migration", "Move from on-prem or another cloud with zero downtime.", "AWS · Azure · GCP"),
          feature(A, "layers", "Kubernetes setup", "Production-ready clusters with GitOps and autoscaling.", "EKS · AKS · GKE"),
          feature(A, "branch", "CI/CD pipelines", "Automated build, test and deploy for every repo.", "GitHub · GitLab"),
          feature(A, "shield", "Security & compliance", "Hardening, IAM reviews and SOC 2 readiness.", "Audits"),
          feature(A, "chart", "Cost optimisation", "Cut cloud bills by 30–50% with rightsizing and savings plans.", "FinOps"),
          feature(A, "clock", "24/7 managed ops", "Monitoring, on-call and incident response.", "SRE"),
        ],
      },
      about: {
        title: "Engineers, not salespeople",
        body: "OpsCraft is a team of 18 certified cloud engineers. We've delivered 120+ infrastructure projects for startups and enterprises.\n\nEvery engagement is led by a senior engineer who stays with you from audit to handover.",
        image: pic("t-team-diverse"),
      },
      stats: { items: [stat("120+", "Projects"), stat("38%", "Avg. cloud savings"), stat("18", "Certified engineers"), stat("4.9★", "Client rating")] },
      howitworks: {
        title: "How we work",
        items: [
          row("Free audit", "We review your setup and give you a written report in a week."),
          row("Roadmap", "A fixed-price plan with clear milestones."),
          row("Build & migrate", "We implement, test and migrate with you."),
          row("Handover or run", "Train your team, or let us run it 24/7."),
        ],
      },
      testimonials: {
        title: "Client results",
        items: [
          quote("OpsCraft moved us to EKS in six weeks and our AWS bill went down 41%.", "Harsh Vora", "CTO, Shopwise"),
          quote("Their on-call team has handled every incident before we even noticed.", "Lata Krishnan", "COO, Caremate"),
        ],
      },
      faq: {
        title: "FAQs",
        items: [
          faq("Do you work with small teams?", "Yes. Many of our clients have under 20 engineers."),
          faq("Is the audit really free?", "Yes. You get a written report whether or not you hire us."),
        ],
      },
      contact: { title: "Let's talk about your infrastructure", subtitle: "Tell us where you are today and where you want to be.", formTitle: "Book a free audit" },
    },
  } satisfies Blueprint;
})();

export const TECH_BLUEPRINTS: Blueprint[] = [shipcrate, helmsman, piperocket, nimbus, relay, forgekit, pulsewatch, sentinel, metricly, opscraft];

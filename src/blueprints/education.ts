import { art, pic, feature, person, quote, row, shot, stat, theme } from "./kit";
import type { Blueprint } from "./types";

// School blueprints ("school" module) and university / coaching blueprints ("university" module).

const sprouts = (() => {
  const A = art("f59e0b", "10b981");
  return {
    key: "school-preschool",
    name: "Little Sprouts – Pre-school",
    category: "school",
    description: "Playful, rounded design for pre-schools, playgroups and day care.",
    tags: ["Pre-school", "Playful", "Colourful"],
    moduleKey: "school",
    theme: theme({
      primary: "#f59e0b", secondary: "#10b981", background: "#fffdf7", surface: "#fff6e0", text: "#2d2410",
      headingFont: "Poppins", bodyFont: "Open Sans", radius: "full", style: "modern", heroLayout: "split",
      header: "simple", headerCta: true, variants: { highlights: "cards", gallery: "wide" },
    }),
    sections: ["hero", "about", "highlights", "academics", "gallery", "testimonials", "admissions", "contact"],
    brand: { siteName: "Little Sprouts", tagline: "Play. Learn. Grow.", phone: "+91 98111 55667", email: "hello@littlesprouts.school", address: "Sector 50, Noida", footerText: "Little Sprouts Pre-school" },
    content: {
      hero: { headline: "Where little minds grow big", subheadline: "A safe, joyful pre-school for ages 1.5 to 6, with play-based learning and caring teachers.", ctaLabel: "Book a school visit", ctaLink: "#admissions", image: pic("e-kids-bubbles") },
      about: { title: "Learning through play", body: "Our Montessori-inspired programme builds curiosity, confidence and kindness. Small groups mean every child is seen and heard.", image: pic("e-kids-carpet") },
      highlights: { items: [stat("1:8", "Teacher–child ratio"), stat("CCTV", "Live for parents"), stat("8 am–7 pm", "Day care"), stat("12 yrs", "Of trust")] },
      academics: {
        title: "Programmes",
        items: [
          feature(A, "heart", "Playgroup", "Ages 1.5–2.5 · Sensory play and music.", "Toddlers"),
          feature(A, "star", "Nursery", "Ages 2.5–3.5 · Language and motor skills.", "Nursery"),
          feature(A, "book", "Kindergarten", "Ages 3.5–6 · Phonics, numbers and school readiness.", "KG 1 & 2"),
          feature(A, "home", "Day care", "Healthy meals, naps and activities till 7 pm.", "After school"),
        ],
      },
      gallery: { title: "A day at Little Sprouts", items: [shot("e-kids-circle", "Music & movement"), shot("e-kids-grass", "Garden time"), shot("e-kids-watercolor", "Art corner"), shot("e-kids-toys", "Story circle")] },
      testimonials: { title: "Parents say", items: [quote("My daughter runs to school every morning. The teachers are wonderful.", "Shruti A.", "Parent, Nursery"), quote("The live CCTV and daily updates give us total peace of mind.", "Manish K.", "Parent, Playgroup")] },
      admissions: { title: "Admissions open 2027–28", subtitle: "Book a visit to see our classrooms and meet the teachers.", formTitle: "Book a school visit", buttonLabel: "Request visit" },
      contact: { title: "Contact us", subtitle: "Office hours: 9 am – 5 pm, Monday to Saturday." },
    },
  } satisfies Blueprint;
})();

const greenfield = (() => {
  const A = art("1d4ed8", "16a34a");
  return {
    key: "school-k12",
    name: "Greenfield – K-12 public school",
    category: "school",
    description: "Complete CBSE / ICSE school site with notices, events and faculty.",
    tags: ["K-12", "CBSE", "Complete"],
    moduleKey: "school",
    theme: theme({
      primary: "#1d4ed8", secondary: "#16a34a", background: "#ffffff", surface: "#f2f6ff", text: "#0f172a",
      headingFont: "Montserrat", bodyFont: "Open Sans", radius: "md", style: "classic", heroLayout: "split",
      headerCta: true, variants: { events: "timeline" },
    }),
    sections: ["hero", "highlights", "about", "academics", "faculty", "notices", "events", "gallery", "testimonials", "admissions", "contact"],
    brand: { siteName: "Greenfield Public School", tagline: "CBSE affiliated · Nursery to Class XII", phone: "+91 141 400 1234", email: "office@greenfieldschool.edu.in", address: "Vaishali Nagar, Jaipur", footerText: "Greenfield Public School" },
    content: {
      hero: { headline: "Excellence with values", subheadline: "A CBSE school nurturing 2,400 students in academics, sports and the arts since 1998.", ctaLabel: "Admissions 2027–28", ctaLink: "#admissions", image: pic("e-school-white") },
      highlights: { items: [stat("2,400", "Students"), stat("98.6%", "Class XII results"), stat("12-acre", "Green campus"), stat("40+", "Clubs & sports")] },
      about: { title: "About Greenfield", body: "Greenfield Public School blends strong academics with sports, arts and community service. Smart classrooms, science labs and a 20,000-book library support every learner.", image: pic("e-school-bldg1") },
      academics: {
        title: "Academics",
        items: [
          feature(A, "heart", "Pre-primary", "Nursery – UKG · Play-based learning."),
          feature(A, "book", "Primary", "Classes I – V · Strong foundations."),
          feature(A, "flask", "Middle & secondary", "Classes VI – X · Labs and projects."),
          feature(A, "cap", "Senior secondary", "Science, Commerce and Humanities."),
        ],
      },
      faculty: { title: "Leadership", items: [person("p-w2", "Dr. Seema Sharma", "Principal"), person("p-m5", "Mr. Rajeev Jain", "Vice Principal"), person("p-w4", "Ms. Farah Khan", "Head, Primary Wing")] },
      notices: { title: "Notice board", items: [row("Parent–teacher meeting", "Classes I – VIII, 10 am – 1 pm.", "2026-11-15"), row("Winter uniform from 1 December", "Blazers and sweaters mandatory.", "2026-11-10")] },
      events: { title: "Upcoming events", items: [row("Annual Sports Day", "Track events and march-past.", "2026-12-05"), row("Science Exhibition", "Classes VI – XII projects.", "2026-12-18"), row("Annual Day", "Cultural programme.", "2027-01-24")] },
      gallery: { title: "Campus life", items: [shot("e-sports-track", "Sports Day"), shot("e-lab1", "Science lab"), shot("e-yoga", "Annual Day performance"), shot("e-books-shelf", "Library"), shot("e-brick-school", "Green campus"), shot("e-soccer", "Sports field")] },
      testimonials: { title: "Parents & alumni", items: [quote("Teachers know every child by name. My son has grown so much in confidence.", "Ankit Agarwal", "Parent, Class VII"), quote("Greenfield prepared me for IIT and for life.", "Riya Saxena", "Alumna, Batch 2021")] },
      admissions: { title: "Admissions 2027–28", subtitle: "Registrations open for Nursery to Class IX and XI.", formTitle: "Admission enquiry" },
      contact: { title: "Contact the school office", subtitle: "Monday to Saturday, 8 am – 2 pm." },
    },
  } satisfies Blueprint;
})();

const stmarys = (() => {
  const A = art("7f1d1d", "b45309");
  return {
    key: "school-heritage",
    name: "St. Mary's – Heritage convent school",
    category: "school",
    description: "Dignified, traditional design with serif headings for long-established schools.",
    tags: ["Heritage", "Serif", "Traditional"],
    moduleKey: "school",
    theme: theme({
      primary: "#7f1d1d", secondary: "#b45309", background: "#fffdf8", surface: "#f7f1e6", text: "#231a12",
      headingFont: "Merriweather", bodyFont: "Lato", radius: "none", style: "minimal", heroLayout: "background",
      header: "centered", buttonStyle: "solid", variants: { about: "image-right", notices: "timeline", testimonials: "single" },
    }),
    sections: ["hero", "about", "highlights", "academics", "notices", "gallery", "testimonials", "admissions", "contact"],
    brand: { siteName: "St. Mary's Convent School", tagline: "Est. 1932 · ICSE · Girls' school", phone: "+91 135 265 4321", email: "principal@stmarysconvent.edu.in", address: "Mussoorie Road, Dehradun", footerText: "St. Mary's Convent School" },
    content: {
      hero: { headline: "Ninety years of learning and grace", subheadline: "An ICSE girls' school in the Doon valley, shaping confident, compassionate young women since 1932.", ctaLabel: "Admissions", ctaLink: "#admissions", image: pic("e-arches") },
      about: { title: "Our heritage", body: "Founded by the Sisters of St. Mary in 1932, the school combines a rich tradition with modern teaching. Our alumnae lead in medicine, law, civil services and the arts.", image: pic("e-library-spiral") },
      highlights: { items: [stat("1932", "Founded"), stat("100%", "ICSE pass rate"), stat("1,100", "Students"), stat("Day & boarding", "Options")] },
      academics: { title: "Academics", items: [feature(A, "book", "Junior school", "Classes I – V."), feature(A, "pen", "Middle school", "Classes VI – VIII."), feature(A, "cap", "Senior school", "ICSE & ISC, Classes IX – XII.")] },
      notices: { title: "Notices", items: [row("Founders' Day celebrations", "All parents are invited.", "2026-11-21"), row("Term examinations", "Date sheet on the parent portal.", "2026-12-01")] },
      gallery: { title: "School life", items: [shot("e-arches", "Cloisters"), shot("e-teacher-kids", "Classrooms"), shot("e-sports-track", "Inter-house sports"), shot("e-old-books", "Heritage library")] },
      testimonials: { title: "Alumnae", items: [quote("St. Mary's gave me discipline, kindness and the courage to lead.", "Dr. Anita Rawat", "Alumna, 1994")] },
      admissions: { title: "Admissions", subtitle: "Applications for Class I and Class XI open in November.", formTitle: "Request a prospectus" },
      contact: { title: "Reach us", subtitle: "School office: 8 am – 3 pm." },
    },
  } satisfies Blueprint;
})();

const apex = (() => {
  const A = art("1d4ed8", "f59e0b");
  return {
    key: "university-engineering",
    name: "Apex – Engineering college",
    category: "university",
    description: "Modern engineering college with departments, programmes, research and placements.",
    tags: ["Engineering", "Placements", "Research"],
    moduleKey: "university",
    theme: theme({
      primary: "#1d4ed8", secondary: "#f59e0b", background: "#ffffff", surface: "#f3f6fe", text: "#0f172a",
      headingFont: "Montserrat", bodyFont: "Inter", radius: "md", style: "modern", heroLayout: "split",
      header: "simple", headerCta: true, variants: { research: "alternating", events: "timeline", placements: "cards", stats: "cards" },
    }),
    sections: ["hero", "stats", "about", "departments", "programs", "research", "placements", "events", "testimonials", "admissions", "contact"],
    brand: { siteName: "Apex Institute of Technology", tagline: "NAAC A+ · AICTE approved", phone: "+91 40 2300 4500", email: "admissions@apexit.ac.in", address: "Gachibowli, Hyderabad", footerText: "Apex Institute of Technology" },
    content: {
      hero: { headline: "Engineer the future", subheadline: "B.Tech, M.Tech and PhD programmes with industry labs, research centres and 94% placements.", ctaLabel: "Apply for 2027", ctaLink: "#admissions", image: pic("e-lab3") },
      stats: { items: [stat("94%", "Placement rate"), stat("₹42 LPA", "Highest package"), stat("6,500", "Students"), stat("A+", "NAAC grade")] },
      about: { title: "About Apex", body: "Apex Institute of Technology was founded in 2001 by industry leaders. Our 80-acre campus houses 9 departments, 14 research centres and partnerships with 200+ companies.", image: pic("e-campus-green") },
      departments: { title: "Departments", items: [feature(A, "code", "Computer Science", "AI, data science and systems."), feature(A, "bolt", "Electronics", "VLSI, embedded and communication."), feature(A, "gear", "Mechanical", "Robotics and manufacturing."), feature(A, "building", "Civil", "Structures and smart cities.")] },
      programs: { title: "Programmes", items: [feature(A, "cap", "B.Tech", "4 years · 8 specialisations · JEE / EAPCET.", "Undergraduate"), feature(A, "book", "M.Tech", "2 years · GATE.", "Postgraduate"), feature(A, "flask", "PhD", "Full-time and part-time.", "Doctoral")] },
      research: { title: "Research", items: [{ title: "Centre for AI", meta: "₹12 Cr funded", description: "Applied AI for healthcare and agriculture with national partners.", image: pic("t-dev-pair") }, { title: "EV & Battery Lab", meta: "Industry partnership", description: "Battery management and charging research.", image: pic("e-lab2") }] },
      placements: { items: [stat("540+", "Offers"), stat("180", "Recruiters"), stat("₹9.2 LPA", "Average"), stat("₹42 LPA", "Highest")] },
      events: { title: "Events", items: [row("Tech fest – Apexcon", "48-hour hackathon and talks.", "2027-02-12"), row("Convocation", "Class of 2026.", "2026-12-20")] },
      testimonials: { title: "Student voices", items: [quote("The AI lab let me publish two papers before graduating.", "Aditya Rao", "B.Tech CSE, 2026"), quote("Mock interviews from the placement cell made all the difference.", "Sneha Reddy", "Placed at a product company")] },
      admissions: { title: "Admissions 2027", subtitle: "Apply online or talk to an admissions counsellor.", formTitle: "Admission enquiry" },
      contact: { title: "Contact", subtitle: "Admissions office: 9 am – 5 pm, Monday to Saturday." },
    },
  } satisfies Blueprint;
})();

const vidya = (() => {
  const A = art("0f172a", "c9a227");
  return {
    key: "university-business-school",
    name: "Vidya – Business school (MBA)",
    category: "university",
    description: "Premium navy-and-gold design for MBA and management programmes.",
    tags: ["MBA", "Premium", "Serif"],
    moduleKey: "university",
    theme: theme({
      primary: "#0f172a", secondary: "#c9a227", background: "#fdfcf8", surface: "#f4f1e8", text: "#0f172a",
      headingFont: "Playfair Display", bodyFont: "Lato", radius: "sm", style: "classic", heroLayout: "background",
      header: "transparent", headerCta: true, spacing: "airy", variants: { testimonials: "single", programs: "list" },
    }),
    sections: ["hero", "stats", "programs", "about", "placements", "testimonials", "admissions", "contact"],
    brand: { siteName: "Vidya School of Business", tagline: "AACSB-aligned · AICTE approved", phone: "+91 20 6600 7700", email: "admissions@vidyasb.edu.in", address: "Hinjewadi, Pune", footerText: "Vidya School of Business" },
    content: {
      hero: { headline: "Lead with purpose", subheadline: "A two-year MBA with global immersions, live projects and a network of 9,000 alumni.", ctaLabel: "Apply now", ctaLink: "#admissions", image: pic("e-campus-brick") },
      stats: { items: [stat("₹18.4 LPA", "Average CTC"), stat("100%", "Placement"), stat("9,000", "Alumni"), stat("22", "Global partners")] },
      programs: { title: "Programmes", items: [feature(A, "trophy", "MBA (2 years)", "Finance, Marketing, HR, Operations, Business Analytics.", "Flagship"), feature(A, "clock", "Executive MBA", "Weekend format for working professionals.", "15 months"), feature(A, "chart", "PGDM Business Analytics", "Data-driven management.", "2 years")] },
      about: { title: "Why Vidya", body: "Small cohorts, faculty from industry and a curriculum built around real projects with partner companies. Every student completes a global immersion.", image: pic("b-meeting-gesture") },
      placements: { items: [stat("₹18.4 LPA", "Average"), stat("₹36 LPA", "Highest"), stat("120+", "Recruiters"), stat("3", "International offers")] },
      testimonials: { title: "Alumni", items: [quote("The live projects and mentorship got me into consulting straight out of campus.", "Karan Malhotra", "MBA 2025, Strategy Consultant")] },
      admissions: { title: "Admissions 2027–29", subtitle: "CAT / XAT / GMAT scores accepted.", formTitle: "Talk to admissions" },
      contact: { title: "Visit the campus", subtitle: "Campus tours every Saturday." },
    },
  } satisfies Blueprint;
})();

const brightpath = (() => {
  const A = art("7c3aed", "f97316");
  return {
    key: "university-coaching",
    name: "BrightPath – Coaching institute",
    category: "university",
    description: "Energetic site for JEE / NEET / competitive-exam coaching with results up front.",
    tags: ["Coaching", "Results", "Bold"],
    moduleKey: "university",
    theme: theme({
      primary: "#7c3aed", secondary: "#f97316", background: "#ffffff", surface: "#f7f3ff", text: "#1e1236",
      headingFont: "Poppins", bodyFont: "Inter", radius: "lg", style: "modern", heroLayout: "split",
      header: "simple", headerCta: true, buttonStyle: "solid", spacing: "compact",
    }),
    sections: ["hero", "stats", "programs", "testimonials", "events", "admissions", "contact"],
    brand: { siteName: "BrightPath Academy", tagline: "JEE · NEET · Foundation", phone: "+91 744 240 1122", email: "info@brightpath.academy", address: "Talwandi, Kota", footerText: "BrightPath Academy" },
    content: {
      hero: { headline: "Your rank starts here", subheadline: "Classroom and online coaching for JEE, NEET and Classes 8–10 Foundation, by IITian and AIIMS faculty.", ctaLabel: "Book a free demo class", ctaLink: "#admissions", image: pic("e-lecture2") },
      stats: { items: [stat("1,240", "JEE Advanced qualifiers 2026"), stat("860", "NEET selections"), stat("AIR 17", "Best rank"), stat("15 yrs", "Of results")] },
      programs: { title: "Courses", items: [feature(A, "flask", "JEE Main + Advanced", "2-year and 1-year programmes.", "Class 11–12"), feature(A, "heart", "NEET", "Biology-focused with weekly tests.", "Class 11–12"), feature(A, "star", "Foundation", "Olympiad and board prep.", "Class 8–10")] },
      testimonials: { title: "Toppers speak", items: [quote("Weekly tests and doubt sessions kept me on track. AIR 17 in JEE Advanced.", "Arnav Gupta", "IIT Bombay, CSE"), quote("The biology faculty made NEET feel achievable.", "Simran Kaur", "AIIMS Delhi")] },
      events: { title: "Upcoming", items: [row("Scholarship test – BPSAT", "Up to 90% fee waiver.", "2026-11-30"), row("New batch starts", "JEE 2029 batch.", "2027-04-05")] },
      admissions: { title: "Book a free demo class", subtitle: "Attend a live class before you decide.", formTitle: "Book a demo" },
      contact: { title: "Visit our centre", subtitle: "Open 7 am – 9 pm." },
    },
  } satisfies Blueprint;
})();

export const SCHOOL_BLUEPRINTS: Blueprint[] = [sprouts, greenfield, stmarys];
export const UNIVERSITY_BLUEPRINTS: Blueprint[] = [apex, vidya, brightpath];

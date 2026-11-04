import { art, pic, feature, product, quote, shot, theme } from "./kit";
import type { Blueprint } from "./types";

// Shop / e-commerce blueprints on the "shop" module (WhatsApp ordering).

const loom = (() => {
  const A = art("be185d", "f59e0b");
  return {
    key: "shop-fashion",
    name: "Loom & Lane – Fashion boutique",
    category: "shop",
    description: "Elegant boutique with serif headings, offers and a categorised catalogue.",
    tags: ["Fashion", "Boutique", "Elegant"],
    moduleKey: "shop",
    theme: theme({
      primary: "#be185d", secondary: "#f59e0b", background: "#fffbfa", surface: "#fdf0f4", text: "#2a1520",
      headingFont: "Playfair Display", bodyFont: "Lato", radius: "md", style: "classic", heroLayout: "split",
      header: "centered", variants: { gallery: "wide" },
    }),
    sections: ["hero", "offers", "products", "about", "gallery", "testimonials", "contact"],
    brand: { siteName: "Loom & Lane", tagline: "Handpicked ethnic & western wear", phone: "+91 98100 11223", email: "hello@loomandlane.in", address: "Linking Road, Mumbai", footerText: "Loom & Lane Boutique", whatsapp: "919810011223" },
    content: {
      hero: { headline: "This season's edit is here", subheadline: "Handpicked kurtas, sarees and dresses from independent weavers. Order on WhatsApp, delivered in 2 days.", ctaLabel: "Shop the collection", ctaLink: "#products", image: pic("s-ethnic3") },
      offers: { title: "Festive offers", items: [feature(A, "gift", "Flat 25% off", "On the whole festive edit, this week only.", "Festive sale"), feature(A, "truck", "Free delivery", "On orders above ₹1,499 in Mumbai.", "Delivery"), feature(A, "star", "Free alterations", "Perfect fit, on us.", "Tailoring")] },
      products: {
        title: "New arrivals", subtitle: "Tap to order on WhatsApp.",
        items: [
          product("s-ethnic2", "Chanderi silk kurta", "Women", "₹2,199", "Hand-block print, sizes S–XXL."),
          product("s-ethnic1", "Banarasi saree", "Women", "₹5,499", "Pure silk with zari border."),
          product("s-blouses", "Linen co-ord set", "Women", "₹2,899", "Breathable summer linen."),
          product("s-hanging", "Nehru jacket", "Men", "₹1,999", "Textured cotton, 4 colours."),
          product("s-clothes-rack", "Kurta pyjama set", "Men", "₹2,499", "Festive cotton silk."),
          product("g-gift-ribbon", "Gift card", "Gifts", "₹1,000", "Delivered on WhatsApp."),
        ],
      },
      about: { title: "Made by hand, chosen with care", body: "We work directly with 40 weaver families across Varanasi, Chanderi and Jaipur, so every piece is fairly made and truly one of a kind.", image: pic("s-ethnic5") },
      gallery: { title: "Inside the store", items: [shot("s-boutique1", "The festive wall"), shot("s-ethnic4", "Styling studio"), shot("g-gift-gold", "Gift wrapping"), shot("s-boutique2", "New arrivals")] },
      testimonials: { title: "Loved by our customers", items: [quote("Beautiful fabrics and the fit was perfect after free alterations!", "Priya S.", "Bandra"), quote("Ordered on WhatsApp at night, delivered the next afternoon.", "Nikita R.", "Andheri")] },
      contact: { title: "Visit or message us", subtitle: "Open 11 am – 9 pm, all days.", formTitle: "Ask about a product" },
    },
  } satisfies Blueprint;
})();

const dailyfresh = (() => {
  const A = art("16a34a", "facc15");
  return {
    key: "shop-grocery",
    name: "Daily Fresh – Grocery & kirana",
    category: "shop",
    description: "Bright, friendly grocery store with offers and quick WhatsApp ordering.",
    tags: ["Grocery", "Local", "Bright"],
    moduleKey: "shop",
    theme: theme({
      primary: "#16a34a", secondary: "#facc15", background: "#ffffff", surface: "#f2fbf3", text: "#14261a",
      headingFont: "Poppins", bodyFont: "Open Sans", radius: "lg", style: "modern", heroLayout: "split",
      header: "simple", headerCta: true, spacing: "compact", buttonStyle: "solid",
    }),
    sections: ["hero", "offers", "products", "testimonials", "contact"],
    brand: { siteName: "Daily Fresh Mart", tagline: "Groceries at your door in 30 minutes", phone: "+91 99000 44556", email: "orders@dailyfresh.in", address: "Sector 21, Gurugram", footerText: "Daily Fresh Mart", whatsapp: "919900044556" },
    content: {
      hero: { headline: "Fresh groceries in 30 minutes", subheadline: "Fruits, vegetables, dairy and daily essentials from your neighbourhood store. Order on WhatsApp.", ctaLabel: "Order now", ctaLink: "#products", image: pic("s-veg-stand") },
      offers: { title: "Today's deals", items: [feature(A, "leaf", "Fresh veggies combo", "5 kg seasonal vegetables for ₹249.", "Combo"), feature(A, "truck", "Free delivery", "On orders above ₹499.", "Delivery"), feature(A, "gift", "Weekly hamper", "Save 15% with a weekly subscription.", "Subscribe")] },
      products: {
        title: "Popular items", subtitle: "Prices updated daily.",
        items: [
          product("s-tomatoes", "Farm tomatoes (1 kg)", "Fruits & vegetables", "₹40", "Locally grown."),
          product("s-onions", "Onions (2 kg)", "Fruits & vegetables", "₹70", "Nashik onions."),
          product("s-mango", "Alphonso mangoes (1 dozen)", "Fruits & vegetables", "₹699", "Ratnagiri, seasonal."),
          product("s-fruit-basket", "Seasonal fruit basket", "Fruits & vegetables", "₹499", "Mangoes, grapes, apples and more."),
          product("s-milk", "Toned milk (1 L)", "Dairy & staples", "₹56", "Delivered chilled."),
          product("s-pastries", "Breakfast bakery box", "Dairy & staples", "₹249", "Croissants and cookies, baked today."),
          product("s-rice", "Basmati rice (5 kg)", "Dairy & staples", "₹549", "Aged, long grain."),
          product("s-oil", "Sunflower oil (1 L)", "Dairy & staples", "₹145", "Refined."),
        ],
      },
      testimonials: { title: "Neighbours love us", items: [quote("Always fresh and always on time. Better than the big apps.", "Ritu K.", "Sector 21"), quote("I just send my list on WhatsApp. So easy.", "Mr. Verma", "Sector 23")] },
      contact: { title: "Order or ask", subtitle: "Open 7 am – 10 pm. Delivery within 3 km.", formTitle: "Send your list" },
    },
  } satisfies Blueprint;
})();

const gadget = (() => {
  const A = art("2563eb", "06b6d4");
  return {
    key: "shop-electronics",
    name: "Gadget Galaxy – Electronics store",
    category: "shop",
    description: "Dark, techy electronics shop with offers and a product grid.",
    tags: ["Electronics", "Dark", "Modern"],
    moduleKey: "shop",
    theme: theme({
      primary: "#2563eb", secondary: "#06b6d4", background: "#0b1220", surface: "#111a2e", text: "#e5edff",
      headingFont: "Montserrat", bodyFont: "Inter", radius: "md", style: "modern", heroLayout: "split",
      header: "simple", headerCta: true, footer: "simple",
    }),
    sections: ["hero", "offers", "products", "about", "testimonials", "contact"],
    brand: { siteName: "Gadget Galaxy", tagline: "Phones, laptops & accessories", phone: "+91 98450 66778", email: "sales@gadgetgalaxy.in", address: "SP Road, Bengaluru", footerText: "Gadget Galaxy Electronics", whatsapp: "919845066778" },
    content: {
      hero: { headline: "The latest tech, best prices in town", subheadline: "Genuine phones, laptops and accessories with bill and brand warranty. EMI available.", ctaLabel: "Browse products", ctaLink: "#products", image: pic("s-store-electronics") },
      offers: { title: "Offers", items: [feature(A, "bolt", "No-cost EMI", "On phones and laptops above ₹15,000.", "Finance"), feature(A, "gift", "Exchange bonus", "Up to ₹8,000 extra on your old phone.", "Exchange"), feature(A, "shield", "Extended warranty", "1 extra year for ₹999.", "Protection")] },
      products: {
        title: "Top picks",
        items: [
          product("s-phone1", "Smartphone Pro 5G", "Phones", "₹54,999", "256 GB, triple camera."),
          product("s-phone2", "Budget 5G phone", "Phones", "₹13,499", "6 GB RAM, 5000 mAh."),
          product("s-laptop", "Ultrabook 14\"", "Laptops", "₹72,990", "16 GB RAM, 1 TB SSD."),
          product("s-watch", "Wireless earbuds", "Audio", "₹4,999", "40 h battery, quick charge."),
          product("s-earbuds", "Smartwatch", "Wearables", "₹3,499", "AMOLED, SpO2."),
          product("s-gadgets", "ANC headphones", "Audio", "₹7,999", "Noise cancelling, 30 h battery."),
        ],
      },
      about: { title: "Genuine products, honest advice", body: "Authorised dealer for 12 brands since 2009. Every product comes with a GST bill and full brand warranty.", image: pic("s-headphones") },
      testimonials: { title: "Reviews", items: [quote("Got the best exchange price for my old phone.", "Karthik R.", "Customer"), quote("They set up my laptop and transferred all my data free.", "Asha N.", "Customer")] },
      contact: { title: "Check availability", subtitle: "Send the model you want and we'll confirm stock and price.", formTitle: "Ask for a price" },
    },
  } satisfies Blueprint;
})();

const beanbrew = (() => {
  const A = art("92400e", "d97706");
  return {
    key: "shop-cafe-bakery",
    name: "Bean & Brew – Café & bakery",
    category: "shop",
    description: "Warm café / bakery menu site with a gallery and online orders.",
    tags: ["Café", "Bakery", "Warm"],
    moduleKey: "shop",
    theme: theme({
      primary: "#92400e", secondary: "#d97706", background: "#fffaf3", surface: "#f8efe2", text: "#2b1a0e",
      headingFont: "Lora", bodyFont: "Lato", radius: "lg", style: "minimal", heroLayout: "background",
      header: "transparent", buttonStyle: "solid", variants: { about: "centered" },
    }),
    sections: ["hero", "about", "products", "offers", "gallery", "testimonials", "contact"],
    brand: { siteName: "Bean & Brew", tagline: "Specialty coffee & fresh bakes", phone: "+91 98765 99001", email: "hello@beanandbrew.cafe", address: "Koregaon Park, Pune", footerText: "Bean & Brew Café", whatsapp: "919876599001" },
    content: {
      hero: { headline: "Freshly roasted. Freshly baked.", subheadline: "Single-origin coffee and bakes made every morning. Dine in, take away or order on WhatsApp.", ctaLabel: "See the menu", ctaLink: "#products", image: pic("s-cafe3") },
      about: { title: "Our story", body: "Bean & Brew started as a weekend coffee cart in 2017. Today we roast beans from Chikmagalur estates and bake everything in-house, every morning.", image: pic("s-barista") },
      products: {
        title: "Menu", subtitle: "Order on WhatsApp for pickup or delivery.", orderLabel: "Order",
        items: [
          product("s-cappuccino", "Cappuccino", "Coffee", "₹180", "Double shot, house blend."),
          product("s-iced-coffee", "Cold brew", "Coffee", "₹220", "Steeped 18 hours."),
          product("s-croissant", "Butter croissant", "Bakery", "₹140", "Laminated in-house."),
          product("s-choc-cake", "Chocolate cake slice", "Bakery", "₹190", "70% dark chocolate."),
          product("s-celebration-cake", "Celebration cake (1 kg)", "Cakes", "₹1,450", "Order 24 h ahead."),
          product("s-avocado-toast", "Avocado toast", "Breakfast", "₹290", "Sourdough, chilli flakes."),
        ],
      },
      offers: { title: "Specials", items: [feature(A, "clock", "Happy hours", "Buy 1 get 1 on cold coffees, 3–5 pm."), feature(A, "gift", "Loyalty card", "Your 10th coffee is free.")] },
      gallery: { title: "Around the café", items: [shot("s-cafe1", "The brew bar"), shot("s-pastries", "Morning bakes"), shot("s-cafe2", "Cosy corners"), shot("s-cafe3", "Weekend crowd"), shot("s-latte-art", "Latte art"), shot("s-cake-coffee", "Custom cakes")] },
      testimonials: { title: "Regulars say", items: [quote("Best cold brew in Pune, hands down.", "Aditi", "Regular"), quote("The croissants sell out by 10 am for a reason.", "Rahul", "Regular")] },
      contact: { title: "Find us", subtitle: "Open 8 am – 11 pm, every day.", formTitle: "Order a cake or book a table" },
    },
  } satisfies Blueprint;
})();

const bloom = (() => {
  const A = art("9333ea", "f472b6");
  return {
    key: "shop-gifts-florist",
    name: "Bloom – Gifts & florist",
    category: "shop",
    description: "Soft, airy gift and flower shop with pill buttons and same-day delivery offers.",
    tags: ["Gifts", "Flowers", "Soft"],
    moduleKey: "shop",
    theme: theme({
      primary: "#9333ea", secondary: "#f472b6", background: "#ffffff", surface: "#faf5ff", text: "#2e1a3d",
      headingFont: "DM Serif Display", bodyFont: "Poppins", radius: "full", style: "minimal", heroLayout: "split-reverse",
      header: "centered", spacing: "airy", buttonStyle: "soft", footer: "simple",
    }),
    sections: ["hero", "products", "offers", "testimonials", "contact"],
    brand: { siteName: "Bloom", tagline: "Flowers & gifts, delivered today", phone: "+91 90040 77889", email: "hello@bloomgifts.in", address: "Jubilee Hills, Hyderabad", footerText: "Bloom Gifts & Florist", whatsapp: "919004077889" },
    content: {
      hero: { headline: "Send a little joy today", subheadline: "Fresh bouquets, cakes and curated gift boxes, delivered the same day across Hyderabad.", ctaLabel: "Choose a gift", ctaLink: "#products", image: pic("f-bouquet") },
      products: {
        title: "Bestsellers",
        items: [
          product("f-red-roses", "Red rose bouquet", "Flowers", "₹999", "12 premium roses."),
          product("f-orchid", "Orchid arrangement", "Flowers", "₹1,799", "Purple orchids in a vase."),
          product("g-gift1", "Birthday gift box", "Gift boxes", "₹1,499", "Chocolates, candle, card."),
          product("g-gift-flowers", "Anniversary hamper", "Gift boxes", "₹2,499", "Flowers, cake and wine glasses."),
        ],
      },
      offers: { title: "Why Bloom", items: [feature(A, "truck", "Same-day delivery", "Order by 6 pm."), feature(A, "pen", "Free message card", "Handwritten, every order."), feature(A, "camera", "Photo before delivery", "See exactly what they'll get.")] },
      testimonials: { title: "Happy moments", items: [quote("My mom cried happy tears. Beautiful flowers and on time.", "Sneha", "Customer"), quote("They sent a photo before delivery. So thoughtful.", "Varun", "Customer")] },
      contact: { title: "Custom orders", subtitle: "Weddings, events or corporate gifting: tell us what you need.", formTitle: "Ask us" },
    },
  } satisfies Blueprint;
})();

export const SHOP_BLUEPRINTS: Blueprint[] = [loom, dailyfresh, gadget, beanbrew, bloom];

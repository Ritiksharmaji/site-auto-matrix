// Seeds local development data: one super admin, one staff member and four
// demo clients (school, company, university, shop), each with a site and a client login.
// All accounts use SEED_PASSWORD from .env.
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getModule, initialSiteConfig } from "../src/modules/registry";

const db = new PrismaClient();

async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password) throw new Error("Set SEED_PASSWORD in .env");
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await db.user.upsert({
    where: { email: "admin@siteplatform.test" },
    update: {},
    create: { name: "Platform Owner", email: "admin@siteplatform.test", passwordHash, role: "SUPER_ADMIN" },
  });

  const staff = await db.user.upsert({
    where: { email: "staff@siteplatform.test" },
    update: {},
    create: {
      name: "Team Member",
      email: "staff@siteplatform.test",
      passwordHash,
      role: "STAFF",
      createdById: admin.id,
      permissions: { maxClients: 10, canPublish: false, canDeleteClients: false, allowedModules: ["school", "company"] },
    },
  });

  const demos = [
    { slug: "greenvalley", module: "school", preset: "academic-blue", client: "Green Valley Public School", contact: "Anita Sharma", email: "school@siteplatform.test", owner: admin.id },
    { slug: "nexora", module: "company", preset: "startup-violet", client: "Nexora Solutions", contact: "Arjun Kapoor", email: "company@siteplatform.test", owner: staff.id },
    { slug: "horizon", module: "university", preset: "scholar-navy", client: "Horizon University", contact: "Registrar Office", email: "university@siteplatform.test", owner: admin.id },
    { slug: "urbanthreads", module: "shop", preset: "boutique-rose", client: "Urban Threads", contact: "Meena Gupta", email: "shop@siteplatform.test", owner: staff.id },
  ];

  for (const d of demos) {
    if (await db.site.findUnique({ where: { slug: d.slug } })) continue;
    const mod = getModule(d.module)!;
    const config = initialSiteConfig(mod, d.preset, d.client);
    const client = await db.client.create({
      data: { name: d.client, contactName: d.contact, email: d.email, ownerId: d.owner },
    });
    await db.user.create({
      data: { name: d.contact, email: d.email, passwordHash, role: "CLIENT", clientId: client.id, createdById: d.owner },
    });
    await db.site.create({
      data: {
        clientId: client.id,
        name: d.client,
        slug: d.slug,
        moduleKey: d.module,
        enabledSections: config.enabledSections,
        theme: config.theme as Prisma.InputJsonValue,
        content: config.content as Prisma.InputJsonValue,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  console.log("Seeded. Logins: admin@, staff@, school@, company@, university@, shop@siteplatform.test (password = SEED_PASSWORD in .env)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

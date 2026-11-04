// Sets a login's password on the live server. Run by deploy/reset-password.sh inside
// the app container; the email and password arrive as environment variables.
const bcrypt = require("/tmp/pwtool/node_modules/bcryptjs");
const { PrismaClient } = require("@prisma/client");

(async () => {
  const email = (process.env.NEW_EMAIL || "").trim().toLowerCase();
  const password = process.env.NEW_PASSWORD || "";
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  const db = new PrismaClient();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No login with the email ${email}.`);
    process.exit(1);
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  console.log(`Password updated for ${user.email} (${user.role}). Sign in at https://${process.env.PLATFORM_HOST}/login`);
  await db.$disconnect();
})();

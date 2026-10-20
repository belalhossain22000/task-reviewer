import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

// Creates the user if missing. An existing user keeps their password,
// but is guaranteed to have the right role and be active.
const upsertUser = async ({ name, email, password, role }: SeedUser) => {
  const normalizedEmail = email.trim().toLowerCase();
  const hashed = await bcrypt.hash(password, saltRounds);

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { role, isActive: true },
    create: { name, email: normalizedEmail, password: hashed, role },
  });

  console.log(`Seeded ${role}: ${user.email}`);
};

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MENTOR_EMAIL, MENTOR_PASSWORD } =
    process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  await upsertUser({
    name: ADMIN_NAME || "Admin",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: Role.ADMIN,
  });

  // Optional demo mentor so the review flow can be tried right away.
  if (MENTOR_EMAIL && MENTOR_PASSWORD) {
    await upsertUser({
      name: "Demo Mentor",
      email: MENTOR_EMAIL,
      password: MENTOR_PASSWORD,
      role: Role.MENTOR,
    });
  }
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

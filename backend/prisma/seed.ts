import 'dotenv/config';
import { Permission, PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env variable ${name}`);
  return value;
}

interface SeedUser {
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  permissions?: Permission[];
  passwordHash: string;
}

async function ensureUser(u: SeedUser): Promise<boolean> {
  const email = u.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) return false;

  await prisma.user.create({
    data: {
      email,
      passwordHash: u.passwordHash,
      role: u.role,
      status: u.status,
      ...(u.role === Role.INTERN
        ? { internProfile: { create: { fullName: u.fullName } } }
        : {
            staffProfile: {
              create: {
                fullName: u.fullName,
                workEmail: email,
                permissions: u.permissions ?? [],
              },
            },
          }),
    },
  });
  return true;
}

async function main() {
  const adminHash = await bcrypt.hash(required('SEED_ADMIN_PASSWORD'), 12);
  const sampleHash = await bcrypt.hash(required('SEED_SAMPLE_PASSWORD'), 12);

  const users: SeedUser[] = [
    {
      email: required('SEED_ADMIN_EMAIL'),
      fullName: process.env.SEED_ADMIN_NAME || 'Admin',
      role: Role.STAFF,
      status: UserStatus.ACTIVE,
      permissions: Object.values(Permission),
      passwordHash: adminHash,
    },
    ...[1, 2, 3].map(
      (n): SeedUser => ({
        email: `intern${n}@example.com`,
        fullName: `Sample Intern ${n}`,
        role: Role.INTERN,
        status: UserStatus.ACTIVE,
        passwordHash: sampleHash,
      }),
    ),
    {
      email: 'staff.reviewer@example.com',
      fullName: 'Sample Reviewer',
      role: Role.STAFF,
      status: UserStatus.ACTIVE,
      permissions: [
        Permission.CAN_REVIEW_APPLICATIONS,
        Permission.CAN_MANAGE_INTERVIEWS,
        Permission.CAN_REVIEW_TASKS,
      ],
      passwordHash: sampleHash,
    },
    {
      email: 'staff.pending@example.com',
      fullName: 'Sample Pending Staff',
      role: Role.STAFF,
      status: UserStatus.PENDING_APPROVAL,
      permissions: [],
      passwordHash: sampleHash,
    },
  ];

  for (const u of users) {
    const created = await ensureUser(u);
    console.log(`${created ? 'created' : 'exists '} ${u.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
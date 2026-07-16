// Script to create admin user directly in Neon DB
// Uses better-auth's exact password hashing format (scrypt)
// Run: node scripts/create_admin_neon.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);
const p = new PrismaClient();

async function hashPassword(password) {
  // This is the EXACT same format better-auth uses internally
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('Set ADMIN_PASSWORD before creating an admin user.');
  }

  console.log('Connecting to database...');
  console.log('DB URL:', process.env.DATABASE_URL?.substring(0, 40) + '...');

  // Push schema to make sure all tables exist
  console.log('\n✅ Connected! Checking for existing admin...');

  const existingUser = await p.user.findUnique({
    where: { email: 'admin@ethiotelecom.et' }
  });

  if (existingUser) {
    console.log('Admin user already exists! Deleting and recreating...');
    await p.session.deleteMany({ where: { userId: existingUser.id } });
    await p.account.deleteMany({ where: { userId: existingUser.id } });
    await p.user.delete({ where: { id: existingUser.id } });
  }

  console.log('\nCreating admin user...');
  const hashedPassword = await hashPassword(adminPassword);

  // Create the user
  const newUser = await p.user.create({
    data: {
      email: 'admin@ethiotelecom.et',
      name: 'System Admin',
      role: 'ADMIN',
      emailVerified: true,
    }
  });

  // Create the better-auth credential account
  await p.account.create({
    data: {
      accountId: newUser.id,
      providerId: 'credential',
      userId: newUser.id,
      password: hashedPassword,
    }
  });

  console.log('\n=============================');
  console.log('  ✅ ADMIN CREATED!');
  console.log('  Email:    admin@ethiotelecom.et');
  console.log('  Role:     ADMIN');
  console.log('=============================');
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Synchronisation de l\'administrateur...');

  const adminEmail = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('ERREUR : La variable ADMIN_PASSWORD n\'est pas définie dans le fichier .env');
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { 
      password: hash,
      isEmailVerified: true,
      verificationToken: null
    },
    create: {
      email: adminEmail,
      password: hash,
      role: 'ADMIN',
      isEmailVerified: true,
      verificationToken: null
    },
  });

  console.log('Succès : Compte admin synchronisé.');

  console.log('Synchronisation des CPTS...');
 
  await prisma.cPTS.deleteMany({
    where: {
      region: 'Occitanie',
    },
  });

  const cptsData = require('./data/cpts.occitanie');
  
  const rows = [];
  for (const dept of cptsData) {
    for (const cpts of dept.cpts) {
      rows.push({
        name: cpts.name,
        value: cpts.value,
        region: "Occitanie",
        department: dept.department,
      });
    }
  }

  const result = await prisma.cPTS.createMany({
    data: rows,
    skipDuplicates: true,
  });

  console.log(`Succès : ${result.count} CPTS synchronisées.`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('Erreur de seeding:', e);
  process.exit(1);
});

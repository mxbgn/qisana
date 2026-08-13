const { PrismaClient } = require('@prisma/client');
const data = require('../data/cpts.occitanie');

const prisma = new PrismaClient();

async function main() {
  const rows = [];

  for (const dept of data) {
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

  console.log(`Success: ${result.count} CPTS inserted`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

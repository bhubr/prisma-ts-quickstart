import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { buildSchema } from 'type-graphql';
import { resolvers } from './prisma/generated/type-graphql';

const prisma = new PrismaClient();

// A `main` function so that you can use async/await
async function main() {
  const schema = await buildSchema({
    resolvers,
    validate: false,
  });
  const allUsers = await prisma.user.findMany({
    include: {
      authoredIssues: true,
      assignedIssues: true,
    },
  });
  // use `console.dir` to print nested objects
  console.dir(allUsers, { depth: null });

}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

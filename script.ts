import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { buildSchema } from 'type-graphql';
import { ApolloServer } from 'apollo-server';
import { resolvers } from './prisma/generated/type-graphql';

const prisma = new PrismaClient();

// A `main` function so that you can use async/await
async function main() {
  const schema = await buildSchema({
    resolvers,
    validate: false,
  });
  
  // TEMP (use a DB seeder instead!)
  // await prisma.user.create({
  //   data: {
  //     email: 'elsa@prisma.io',
  //     name: 'Elsa Prisma',
  //   },
  // });
  // await prisma.user.create({
  //   data: {
  //     email: 'john@prisma.io',
  //     name: 'John Prisma',
  //   },
  // });

  const server: ApolloServer = new ApolloServer({
    schema,
    context: () => ({ prisma }),
  });
  const { url } = await server.listen();
  console.log(`Apollo Server up&running: ${url}`);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

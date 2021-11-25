# Prisma + TypeGraphQL

## Prisma

* [Disambiguating relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#disambiguating-relations)

## Prisma + TypeGraphQL

* [Installation](https://prisma.typegraphql.com/docs/basics/installation)

```
yarn add -D typegraphql-prisma
yarn add graphql-scalars
yarn add graphql-fields @types/graphql-fields
yarn add reflect-metadata
```

Ajout du "generator" dans schéma Prisma :

```
generator typegraphql {
  provider = "typegraphql-prisma"
  output             = "../prisma/generated/type-graphql"
  emitTranspiledCode = true
}
```

Le fait de mettre l'output explicitement évite que les fichiers .js/.ts générés soient détruits dès qu'on installe un module avec yarn/npm.

> :warning: Probablement sage de mettre tout ça dans `.gitignore` (à titre d'exemple, pour un schéma avec 3 entités, **2,5 Mo de code généré !**)

## Dans `tsconfig.json`

Pour TypeGraphQL, ajouter sous les `compilerOptions` :

```
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
```

## Dans `script.ts` (point d'entrée de l'exemple/starter Prisma)

Ajouter :

```typescript
import 'reflect-metadata';
```

## Une fois le tout configuré

```
MBP-de-Benoit-2:starter benoit$ npx prisma generate
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (3.5.0) to ./node_modules/@prisma/client in 97ms

✔ Generated TypeGraphQL integration to ./node_modules/@generated/type-graphql in 11.78s
You can now start using Prisma Client in your code. Reference: https://pris.ly/d/client
```
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```
```
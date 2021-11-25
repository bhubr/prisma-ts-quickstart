# Prisma + TypeGraphQL

But : faire des essais avec Prisma, ajouter TypeGraphQL, et regarder également comment Prisma génère les données :

* avec des BDD SQL (pas de surprise a priori)
* avec du NoSQL

## Prisma

* [Disambiguating relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#disambiguating-relations)

## Prisma + TypeGraphQL

### Installation

* [Docs TypeGraphQL Prisma - Installation](https://prisma.typegraphql.com/docs/basics/installation)

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

### Dans `tsconfig.json`

Pour TypeGraphQL, ajouter sous les `compilerOptions` :

```
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
```

### Dans `script.ts` (point d'entrée de l'exemple/starter Prisma)

Ajouter :

```typescript
import 'reflect-metadata';
```

### Une fois le tout configuré

````
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (3.5.0) to ./node_modules/@prisma/client in 104ms

✔ Generated TypeGraphQL integration to ./prisma/generated/type-graphql in 13.67s
You can now start using Prisma Client in your code. Reference: https://pris.ly/d/client
```
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```
````

## Passage en NoSQL

Il y a des modifications à apporter sur le schéma Prisma.

> Une (grosse) erreur est rencontrée lors du démarrage (voir plus loin, "Data Source")

### Client

Ajouter sous `generator client`:

```
  previewFeatures = ["mongoDb"]
```

### Modèle de données

Pour résumer :

* Changer les types des id
* Changer les types des "clés" étrangères (`authorId`, etc.)
* Supprimer la table pivot (par exemple dans `User` la liste des id des `Project` associés est sous `projectIDs`).

Voici le résultat du `git diff` après ces modifications :

```
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 18bf812..aaed7a2 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -1,10 +1,11 @@
 datasource db {
-  provider = "sqlite"
+  provider = "mongodb"
   url      = env("DATABASE_URL")
 }
 
 generator client {
   provider = "prisma-client-js"
+  previewFeatures = ["mongoDb"]
 }
 
 generator typegraphql {
@@ -14,39 +15,30 @@ generator typegraphql {
 }
 
 model Issue {
-  id         Int     @id @default(autoincrement())
+  id         String  @id @default(dbgenerated()) @map("_id") @db.ObjectId
   title      String
   content    String?
   published  Boolean @default(false)
   author     User    @relation("AuthoredIssues", fields: [authorId], references: [id])
-  authorId   Int
+  authorId   String  @db.ObjectId
   assignee   User?   @relation("AssignedIssues", fields: [assigneeId], references: [id])
-  assigneeId Int?
+  assigneeId String?  @db.ObjectId
 }
 
 model User {
-  id    Int     @id @default(autoincrement())
+  id    String  @id @default(dbgenerated()) @map("_id") @db.ObjectId
   email String  @unique
   name  String?
   authoredIssues Issue[] @relation("AuthoredIssues")
   assignedIssues Issue[] @relation("AssignedIssues")
-  projects ProjectsOnUsers[]
+  projectIDs String[]   @db.Array(ObjectId)
+  projects  Project[] @relation(fields: [projectIDs])
 }
 
 model Project {
-  id    Int     @id @default(autoincrement())
+  id    String  @id @default(dbgenerated()) @map("_id") @db.ObjectId
   name  String?
   description  String?
-  users ProjectsOnUsers[]
+  userIDs String[] @db.Array(ObjectId)
+  users   User[]   @relation(fields: [userIDs])
 }
-
-model ProjectsOnUsers {
-  user       User     @relation(fields: [userId], references: [id])
-  userId     Int // relation scalar field (used in the `@relation` attribute above)
-  project    Project @relation(fields: [projectId], references: [id])
-  projectId  Int // relation scalar field (used in the `@relation` attribute above)
-  role       String
-
-  @@id([userId, projectId])
-}
-

```

### Data source

Dans le `.env`, la `DATABASE_URL` doit être modifiée. Par exemple :

```
DATABASE_URL=mongodb://localhost:27017/bugtracker_dev?retryWrites=false
```

L'ajout de `?retryWrites=false` permet de résoudre cette erreur rencontrée en essayant d'insérer des users au démarrage de l'app :

```
(node:8293) UnhandledPromiseRejectionWarning: Error: 
Invalid `prisma.user.create()` invocation in
/Users/benoit/Code/CompareORMs/prisma-quickstart/typescript/starter/script.ts:15:35

  12   resolvers,
  13   validate: false,
  14 });
→ 15 const user1 = await prisma.user.create(
  Error occurred during query execution:
ConnectorError(ConnectorError { user_facing_error: None, kind: RawError { code: "unknown", message: "Command failed (IllegalOperation): This MongoDB deployment does not support retryable writes. Please add retryWrites=false to your connection string.)" } })
    at cb (/Users/benoit/Code/CompareORMs/prisma-quickstart/typescript/starter/node_modules/@prisma/client/runtime/index.js:38679:17)
```

> **Après l'ajout** de `retryWrites=false`, on a toujours la même erreur (de fait, après l'essai de la solution ci-dessous, ça ne change rien de l'ajouter !!)

**Autre option pour la résoudre**

Voir [ce post sur SO](https://stackoverflow.com/a/60603587) suggérant le lancement de mongod avec un replica set

Ayant lancé `mongod` via brew (MacOS) il vaut probablement mieux que je le configure via `mongod.conf`. Un `sudo ps aux |grep mongo` m'informe de l'emplacement du fichier de conf :

```
benoit             373   0.3  0.4  5519108  29664   ??  S    Wed01AM   2:15.79 /usr/local/opt/mongodb-community@4.4/bin/mongod --config /usr/local/etc/mongod.conf
```

Ajout de ces lignes sous `/usr/local/etc/mongod.conf` (emplacement probablement différent sous Linux et surtout Windows) ([doc mongo](https://docs.mongodb.com/manual/tutorial/deploy-replica-set/)) :

```
replication:
   replSetName: "rs0"
```

> :warning: **IL FAUT ABSOLUMENT LANCER CECI DANS LE SHELL MONGO**

```
rs.initiate()
```

# GraphQL i18n

[![CircleCI](https://circleci.com/gh/Canner/graphql-i18n/tree/master.svg?style=shield)](https://circleci.com/gh/Canner/graphql-i18n/tree/master)
[![npm version](https://badge.fury.io/js/graphql-i18n.svg)](https://badge.fury.io/js/graphql-i18n)

> Internationalization and localization solution in GraphQL.

## Features

* Flexible: Multiple storage adapters can be chosen to store i18n.
* Easily use: Add a simple middleware, and your service is ready for i18n.

## Installation

```sh
yarn add graphql-i18n
```

## Example

Setup GraphQL Server

```typescript
import { GraphQLServer } from 'graphql-yoga'
import { I18n } from 'graphql-i18n';

const adapter = {
    type: 'memory',
};

const schema = {
    Book: {
        idFromObject: (object: any) => object.id,
        fields: ['name', 'author.name'],
    },
};

const i18n = new I18n({ adapter, schema, defaultLang: 'en' });

const id = '1';
const where = { type: 'Book', id };
const dataEn = { name: 'test', author: { name: 'testAuthor' } };
const dataZh = { name: '測試', author: { name: '測試作者' } };
i18n.sync(where, dataEn, 'en');
i18n.sync(where, dataZh, 'zh');

const typeDefs = `
    directive @locale (
        lang: String!
    ) on FIELD

    type Query {
        book: Book!
        books: [Book!]!
    }

    type Book {
        id: ID!
        name: String!
        author: BookAuthor!
    }

    type BookAuthor {
        name: String!
    }
`;

const resolvers = {
    Query: {
        book: () => ({ id, ...dataEn }),
        books: () => ([{ id, ...dataEn }]),
    }
};

const server = new GraphQLServer({
    typeDefs,
    resolvers,
    middlewares: [i18n.middleware()]
})

server.start(() => console.log('Server is running on http://localhost:4000'))
```

Now, you can get i18n by add directive `locale` in your Query.

```GraphQL
query {
    book @locale(lang: "en") {
        name
        author {
            name
        }
    }
    books @locale(lang: "zh") {
        name
        author {
            name
        }
    }
}
```

## Adapters

### Memory Adapter

Store i18n data in memory. Data will be lost after closing server.

```typescript
const adapter = {
    type: 'memory'
};
```

### MongoDB Adapter (coming soon)

Store i18n data in MongoDB.

```typescript
const adapter = {
    type: 'mongodb',
    uri: 'mongodb://...'
};
```

### Firebase Adapter (coming soon)

Store i18n data in Firebase.

## License

Apache-2.0

![footer banner](https://user-images.githubusercontent.com/26116324/37811196-a437d930-2e93-11e8-97d8-0653ace2a46d.png)

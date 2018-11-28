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
import { MemoryAdapter } from 'graphql-i18n/adapter';

const typeConfig = {
  Book: {
    idFromObject: (object: any) => object.id, // get id from object
    fields: ['name', 'author.name'], // i18n fields
},
};

const resolverConfig = {
  Query: {
    book: {
      dataType: 'Book' // target type for i18n
    },
    books: {
      dataType: 'Book'
    }
  }
};

const adapter = MemoryAdapter(typeConfig);

const i18n = new I18n({ adapter, typeConfig, resolverConfig, defaultLang: 'en' });

const where = { type: 'Book', id: '1' };
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
        book: () => ({ id: '1', ...dataEn }),
        books: () => ([{ id: '1', ...dataEn }]),
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

[![Edit graphql-i18n demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/pkw76vxm6x)

## API

### Types

```typescript
export interface IWhereUnique {
  id: string;
  type: string;
}

export interface IWhere {
  ids: string[];
  type: string;
}

export interface II18n {
  sync(where: IWhereUnique, data: Record<string, string>, language: string): Promise<void>;
  find(where: IWhere, language: string): Promise<Record<string, any>>;
  findOne(where: IWhereUnique, language: string): Promise<any>;
  destroy(where: IWhereUnique, language: string): Promise<void>;
  middleware(): IMiddleware;
}

export interface ITypeConfig {
  [key: string]: {
    idFromObject: (object: any) => string;
    fields: string[];
  };
}

export interface IResolverConfig {
  Query: {
    [key: string]: {
      dataType: string;
      dataPath?: string;
    },
  };
}

export interface IAdapter {
  create(where: IWhereUnique, data: Record<string, any>, language: string): Promise<any>;
  update(where: IWhereUnique, data: Record<string, any>, language: string): Promise<any>;
  find(where: IWhere, language: string): Promise<Record<string, any>>;
  findOne(where: IWhereUnique, language: string): Promise<null | Record<string, any>>;
  destroy(where: IWhereUnique, language: string): Promise<void>;
}

export interface II18nConstructorOptions {
  adapter: IAdapter;
  typeConfig: ITypeConfig;
  resolverConfig: IResolverConfig;
  defaultLang: string;
}
```

### `i18n.sync(where, data, language)`

Create or update i18n data.

### `i18n.find(where, language)`

Find list of i18n data. If `language` is not existent, graphql-i18n will find default language.

### `i18n.findOne(where, language)`

Find one of i18n data. If `language` is not existent, graphql-i18n will find default language.

### `i18n.destroy(where, language)`

Destroy one of i18n data.

## Adapters

### Memory Adapter

Store i18n data in memory. Data will be lost after closing server.

```typescript
import { MemoryAdapter } from 'graphql-i18n/adapter';
const memoryAdapter = new MemoryAdapter(
  // type config
);
```

### MongoDB Adapter

Store i18n data in MongoDB.

```typescript
import { MongodbAdapter } from 'graphql-i18n/adapter';
const mongodbAdapter = new MongodbAdapter(
  // mongodb uri
);
```

### Firebase Adapter (coming soon)

Store i18n data in Firebase.

## License

Apache-2.0

![footer banner](https://user-images.githubusercontent.com/26116324/37811196-a437d930-2e93-11e8-97d8-0653ace2a46d.png)

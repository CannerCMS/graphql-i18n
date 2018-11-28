import * as chai from 'chai';
import { graphql } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import { makeExecutableSchema } from 'graphql-tools';

import { I18n } from '../src/index';
import { MemoryAdapter } from '../src/adapter';

const expect = chai.expect;

describe('i18n middleware', async () => {
  beforeEach(async () => {
    const typeConfig = {
      Book: {
        idFromObject: (object: any) => object.id,
        objectsFromResolve: (result: any) => {
          return result.edges.map(o => o.book);
        },
        fields: ['name', 'author.name'],
      },
    };

    const resolverConfig = {
      Query: {
        book: {
          dataType: 'Book',
        },
        books: {
          dataType: 'Book',
        },
        bookEdges: {
          dataType: 'Book',
          dataPath: 'book',
        },
        bookConnection: {
          dataType: 'Book',
          dataPath: 'edges[].book',
        },
      },
    };

    const memoryAdapter = new MemoryAdapter(typeConfig);
    this.i18n = new I18n({ adapter: memoryAdapter, typeConfig, resolverConfig, defaultLang: 'en' });
  });

  it('graphql query', async () => {
    const id = '1';
    const where = { type: 'Book', id };
    const dataEn = { name: 'test', author: { name: 'testAuthor' } };
    const dataZh = { name: '測試', author: { name: '測試作者' } };
    this.i18n.sync(where, dataEn, 'en');
    this.i18n.sync(where, dataZh, 'zh');

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
      },
      Book: {
        name: () => 'just test',
      },
    };
    const typeConfig = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    const schemaWithPermissions = applyMiddleware(typeConfig, this.i18n.middleware());
    // Execution
    const query = `
      query {
        book @locale(lang: "zh") {
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
    `;
    const { data } = await graphql(schemaWithPermissions, query);
    expect(data.book).to.be.eql(dataZh);
    expect(data.books).to.be.eql([dataZh]);
  });

  it('graphql deep query', async () => {
    const id = '1';
    const where = { type: 'Book', id };
    const dataEn = { name: 'test', author: { name: 'testAuthor' } };
    const dataZh = { name: '測試', author: { name: '測試作者' } };
    this.i18n.sync(where, dataEn, 'en');
    this.i18n.sync(where, dataZh, 'zh');

    const typeDefs = `
      directive @locale (
        lang: String!
      ) on FIELD

      type Query {
        bookEdges: [BookEdge!]!
        bookConnection: BookConnection!
      }

      type BookConnection {
        edges: [BookEdge!]!
      }

      type BookEdge {
        book: Book!
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
        bookEdges: () => [{
          book: {
            id,
            name: 'test',
            author: {
              name: 'test',
            },
          },
        }],
        bookConnection: () => ({
          edges: [{
            book: {
              id,
              name: 'test',
              author: {
                name: 'test',
              },
            },
          }],
        }),
      },
    };
    const typeConfig = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    const schemaWithPermissions = applyMiddleware(typeConfig, this.i18n.middleware());
    // Execution
    const query = `
      query {
        bookEdges @locale(lang: "zh") {
          book {
            name
            author {
              name
            }
          }
        }
        bookConnection @locale(lang: "zh") {
          edges {
            book {
              name
              author {
                name
              }
            }
          }
        }
      }
    `;
    const { data } = await graphql(schemaWithPermissions, query);
    expect(data.bookEdges).to.be.eql([{ book: dataZh }]);
    expect(data.bookConnection).to.be.eql({
      edges: [{
        book: dataZh,
      }],
    });
  });
});

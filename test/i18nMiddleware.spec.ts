import * as chai from 'chai';
import { graphql } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import { makeExecutableSchema } from 'graphql-tools';

import { I18n } from '../src/index';

const expect = chai.expect;

describe('i18n middleware', async () => {
  beforeEach(async () => {
    const adapter = {
      type: 'memory',
    };

    const schema = {
      Book: {
        idFromObject: (object: any) => object.id,
        fields: ['name', 'author.name'],
      },
    };

    this.i18n = new I18n({adapter, schema, defaultLang: 'en'});
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
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    const schemaWithPermissions = applyMiddleware(schema, this.i18n.middleware());
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
  });
});

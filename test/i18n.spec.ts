/* tslint:disable:no-unused-expression */
import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import mongoose from 'mongoose';

import { I18n } from '../src/index';
import { MemoryAdapter, MongodbAdapter } from '../src/adapter';

chai.use(chaiAsPromised);
const expect = chai.expect;

function testSuit() {
  it('where.type error in sync', async () => {
    const whereUnique = { id: '1', type: 'Test' };
    const data = {};
    const language = 'en';

    expect(this.i18n.sync(whereUnique, data, language)).to.be.rejectedWith(Error);
  });

  it('where.type error in find', async () => {
    const where = { ids: ['1'], type: 'Test' };
    const data = {};
    const language = 'en';

    expect(this.i18n.find(where, data, language)).to.be.rejectedWith(Error);
  });

  it('where.type error in findOne', async () => {
    const whereUnique = { id: '1', type: 'Test' };
    const data = {};
    const language = 'en';

    expect(this.i18n.findOne(whereUnique, data, language)).to.be.rejectedWith(Error);
  });

  it('where.type error in destroy', async () => {
    const whereUnique = { id: '1', type: 'Test' };
    const data = {};
    const language = 'en';

    expect(this.i18n.destroy(whereUnique, data, language)).to.be.rejectedWith(Error);
  });

  it('data keys not match typeConfig', async () => {
    const whereUnique = { id: '1', type: 'Book' };
    const data = { author: { name: 'Test' }};
    const language = 'en';

    expect(this.i18n.sync(whereUnique, data, language)).to.be.rejectedWith(Error);
  });

  it('find one data', async () => {
    const whereUnique = { id: '1', type: 'Book' };
    const data = {
      name: 'test',
      author: { name: 'test.author' },
    };
    const language = 'en';

    await this.i18n.sync(whereUnique, data, language);

    const result = await this.i18n.findOne(whereUnique, language);
    expect(result).to.be.eql(result);
  });

  it('find one data without default language', async () => {
    const whereUnique = { id: '1', type: 'Book' };
    const data = {
      name: 'test',
      author: { name: '測試' },
    };
    const language = 'zh';

    await this.i18n.sync(whereUnique, data, language);

    const result = await this.i18n.findOne(whereUnique, language);
    expect(result).to.be.eql(result);
  });

  it('find one data with nonexistent language', async () => {
    const whereUnique = { id: '1', type: 'Book' };
    const data = {
      name: 'test',
      author: { name: 'test.author' },
    };
    const language = 'zh';

    await this.i18n.sync(whereUnique, data, language);

    const result = await this.i18n.findOne(whereUnique, language);
    expect(result).to.be.eql(result);
  });

  it('find data', async () => {
    const whereUnique1 = { id: '1', type: 'Book' };
    const data1 = {
      name: 'test1',
      author: { name: 'test.author1' },
    };
    const whereUnique2 = { id: '2', type: 'Book' };
    const data2 = {
      name: 'test2',
      author: { name: 'test.author2' },
    };
    const where = { ids: ['1', '2'], type: 'Book'};
    const language = 'en';

    await this.i18n.sync(whereUnique1, data1, language);
    await this.i18n.sync(whereUnique2, data2, language);

    const results = await this.i18n.find(where, language);
    expect(results).to.deep.include({
      [`${whereUnique1.id}`]: data1,
      [`${whereUnique2.id}`]: data2,
    });
  });

  it('find data without default language', async () => {
    const whereUnique1 = { id: '1', type: 'Book' };
    const data1 = {
      name: '測試1',
      author: { name: '測試作者2' },
    };
    const whereUnique2 = { id: '2', type: 'Book' };
    const data2 = {
      name: '測試2',
      author: { name: '測試作者2' },
    };
    const where = { ids: ['1', '2'], type: 'Book'};
    const language = 'zh';

    await this.i18n.sync(whereUnique1, data1, language);
    await this.i18n.sync(whereUnique2, data2, language);

    const results = await this.i18n.find(where, language);
    expect(results).to.deep.include({
      [`${whereUnique1.id}`]: data1,
      [`${whereUnique2.id}`]: data2,
    });
  });

  it('find data with nonexistent language', async () => {
    const whereUnique1 = { id: '1', type: 'Book' };
    const data1 = {
      name: 'test1',
      author: { name: 'test.author1' },
    };
    const whereUnique2 = { id: '2', type: 'Book' };
    const data2 = {
      name: 'test2',
      author: { name: 'test.author2' },
    };
    const where = { ids: ['1', '2'], type: 'Book'};
    const language = 'zh';

    await this.i18n.sync(whereUnique1, data1, language);
    await this.i18n.sync(whereUnique2, data2, language);

    const results = await this.i18n.find(where, language);
    expect(results).to.deep.include({
      [`${whereUnique1.id}`]: data1,
      [`${whereUnique2.id}`]: data2,
    });
  });

  it('update data', async () => {
    const whereUnique = { id: '1', type: 'Book' };
    let data = {
      name: 'test',
      author: { name: 'test.author' },
    };
    const language = 'en';

    await this.i18n.sync(whereUnique, data, language);

    // update data
    data = {
      name: 'testNew',
      author: { name: 'test.author.new' },
    };
    await this.i18n.sync(whereUnique, data, language);

    const result = await this.i18n.findOne(whereUnique, language);
    expect(result).to.be.eql(data);
  });

  it('destroy data', async () => {
    const whereUnique = { id: '1', type: 'Book' };
    const data = {
      name: 'test',
      author: { name: 'test.author' },
    };
    const language = 'en';

    await this.i18n.sync(whereUnique, data, language);

    // destroy data
    await this.i18n.destroy(whereUnique, language);

    const result = await this.i18n.findOne(whereUnique, language);
    expect(result).to.be.null;
  });
}

describe('i18n class', () => {
  it('fields empty error', () => {
    const typeConfig = {
      Test: {
        idFromObject: object => object.id,
        fields: [],
      },
    };

    const resolverConfig = {
      Query: {
        test: {
          dataType: 'Test',
        },
      },
    };

    const memoryAdapter = new MemoryAdapter(typeConfig);
    expect(() => new I18n({ adapter: memoryAdapter, typeConfig, resolverConfig, defaultLang: 'en' })).to.throw();
  });

  it('resolver data type not match error', () => {
    const typeConfig = {
      User: {
        idFromObject: object => object.id,
        fields: ['name'],
      },
    };

    const resolverConfig = {
      Query: {
        user: {
          dataType: 'Test',
        },
      },
    };

    const memoryAdapter = new MemoryAdapter(typeConfig);
    expect(() => new I18n({ adapter: memoryAdapter, typeConfig, resolverConfig, defaultLang: 'en' })).to.throw();
  });

  it('resolver data path invalid error', () => {
    const typeConfig = {
      User: {
        idFromObject: object => object.id,
        fields: ['name'],
      },
    };

    const resolverConfig = {
      Query: {
        user: {
          dataType: 'User',
          dataPath: '.',
        },
      },
    };

    const memoryAdapter = new MemoryAdapter(typeConfig);
    expect(() => new I18n({ adapter: memoryAdapter, typeConfig, resolverConfig, defaultLang: 'en' })).to.throw();
  });
});

describe('i18n with memory adapter', () => {
  beforeEach(async () => {
    const typeConfig = {
      User: {
        idFromObject: object => object.id,
        fields: ['name'],
      },
      Book: {
        idFromObject: object => object.id,
        fields: ['name', 'author.name'],
      },
    };

    const resolverConfig = {
      Query: {
        user: {
          dataType: 'User',
        },
        book: {
          dataType: 'Book',
        },
      },
    };

    const memoryAdapter = new MemoryAdapter(typeConfig);
    this.i18n = new I18n({ adapter: memoryAdapter, typeConfig, resolverConfig, defaultLang: 'en' });
  });

  testSuit.call(this);
});

describe('i18n with mongodb adapter', () => {
  before(async () => {
    const typeConfig = {
      User: {
        idFromObject: object => object.id,
        fields: ['name'],
      },
      Book: {
        idFromObject: object => object.id,
        fields: ['name', 'author.name'],
      },
    };

    const resolverConfig = {
      Query: {
        user: {
          dataType: 'User',
        },
        book: {
          dataType: 'Book',
        },
      },
    };

    const mongodbAdapter = new MongodbAdapter('mongodb://localhost:27017/__test__');
    this.i18n = new I18n({ adapter: mongodbAdapter, typeConfig, resolverConfig, defaultLang: 'en' });
  });

  afterEach(async () => {
    await mongoose.model('I18n').remove({});
  });

  after(async () => {
    await mongoose.connection.close();
  });

  testSuit.call(this);
});

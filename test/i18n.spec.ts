/* tslint:disable:no-unused-expression */
import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import { I18n } from '../src/index';

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

  it('data keys not match schema', async () => {
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
  it('adapter not support error', () => {
    const adapter = {
      type: 'not support',
    };

    const schema = {
      Test: {
        idFromObject: object => object.id,
        fields: ['name'],
      },
    };

    expect(() => new I18n({adapter, schema, defaultLang: 'en'})).to.throw();
  });

  it('fields empty error', () => {
    const adapter = {
      type: 'memory',
    };

    const schema = {
      Test: {
        idFromObject: object => object.id,
        fields: [],
      },
    };

    expect(() => new I18n({adapter, schema, defaultLang: 'en'})).to.throw();
  });
});

describe('i18n with memory adapter', () => {
  beforeEach(async () => {
    const adapter = {
      type: 'memory',
    };

    const schema = {
      User: {
        idFromObject: object => object.id,
        fields: ['name'],
      },
      Book: {
        idFromObject: object => object.id,
        fields: ['name', 'author.name'],
      },
    };

    this.i18n = new I18n({adapter, schema, defaultLang: 'en'});
  });

  testSuit.call(this);
});

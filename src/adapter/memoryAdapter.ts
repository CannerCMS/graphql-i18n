import { pick } from 'lodash';

import { IAdapter, ISchema, IWhereUnique, IWhere } from './types';

export class MemoryAdapter implements IAdapter {
  // storage
  // {
  //   User: {
  //     en: {
  //       1: {
  //         name: 'Tom'
  //       }
  //     },
  //     zh: {
  //       1: {
  //         name: '湯姆'
  //       }
  //     }
  //   }
  // }
  private storage: Record<string, any>;

  constructor(schema: ISchema) {
    this.storage = {};

    Object.keys(schema).map(key => {
      this.storage[key] = {};
    });
  }

  public async create(where: IWhereUnique, data: Record<string, any>, language: string) {
    if (!this.storage[where.type][language]) {
      this.storage[where.type][language] = {};
    }

    if (this.storage[where.type][language][where.id]) {
      throw Error(`Type ${where.type} with id ${where.id} is existent`);
    }

    this.storage[where.type][language][where.id] = data;
  }

  public async update(where: IWhereUnique, data: Record<string, any>, language: string) {
    if (!this.storage[where.type][language] || !this.storage[where.type][language][where.id]) {
      throw Error(`Type ${where.type} with id ${where.id} is nonexistent`);
    }

    this.storage[where.type][language][where.id] = data;
  }

  public async find(where: IWhere, language: string) {
    return this.storage[where.type][language]
      ? pick(this.storage[where.type][language], where.ids)
      : [];
  }

  public async findOne(where: IWhereUnique, language: string) {
    return this.storage[where.type][language] && this.storage[where.type][language][where.id]
      ? this.storage[where.type][language][where.id]
      : null;
  }

  public async destroy(where: IWhereUnique, language: string) {
    if (!this.storage[where.type][language] || !this.storage[where.type][language][where.id]) {
      throw Error(`Type ${where.type} with id ${where.id} is nonexistent`);
    }

    delete this.storage[where.type][language][where.id];
  }
}

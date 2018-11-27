import { Document, connect , Schema, Model, model } from 'mongoose';

import { IAdapter, IWhereUnique, IWhere } from './types';

interface IMongodbI18n {
  id: string;
  type: string;
  data: any;
}

interface IMongodbI18nModel extends IMongodbI18n, Document {
  id: string;
}

export class MongodbAdapter implements IAdapter {
  private i18nModel: Model<IMongodbI18nModel>;

  constructor(uri: string) {
    connect(uri);
    const schema = new Schema({
      id: { type: String, required: true },
      type: { type: String, required: true },
      language: { type: String, required: true },
      data: Schema.Types.Mixed,
    });
    schema.index({ id: 1, type: 1, language: 1 }, { unique: true });
    this.i18nModel = model<IMongodbI18nModel>('I18n', schema);
  }

  public async create(where: IWhereUnique, data: Record<string, any>, language: string) {
    const result = await this.i18nModel.findOne({ ...where, language }).exec();

    if (result) {
      throw Error(`Type ${where.type} with id ${where.id} is existent`);
    }

    const record = new this.i18nModel({
      id: where.id,
      type: where.type,
      language,
      data,
    });
    await record.save();
  }

  public async update(where: IWhereUnique, data: Record<string, any>, language: string) {
    const result = await this.i18nModel.findOne({ ...where, language }).exec();

    if (!result) {
      throw Error(`Type ${where.type} with id ${where.id} is nonexistent`);
    }

    await this.i18nModel.findOneAndUpdate({ ...where, language }, { data }).exec();
  }

  public async find(where: IWhere, language: string) {
    const results = await this.i18nModel.find({
      id: { $in: where.ids },
      type: where.type,
      language,
    }).exec();

    return results.reduce((obj, item) => {
      obj[item.id] = item.data;
      return obj;
    }, {});
  }

  public async findOne(where: IWhereUnique, language: string) {
    const result = await this.i18nModel.findOne({ ...where, language }).exec();
    if (!result) {
      return null;
    }

    return result.data;
  }

  public async destroy(where: IWhereUnique, language: string) {
    const result = await this.i18nModel.findOne({ ...where, language }).exec();

    if (!result) {
      throw Error(`Type ${where.type} with id ${where.id} is nonexistent`);
    }

    await this.i18nModel.findOneAndDelete({ ...where, language }).exec();
  }
}

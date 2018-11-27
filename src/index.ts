import { flatten } from 'flat';
import { find, isEmpty , isEqual, isFunction, isNil } from 'lodash';
import { GraphQLResolveInfo, StringValueNode } from 'graphql';
import { middleware, IMiddlewareFunction, } from 'graphql-middleware';

import { II18nConstructorOptions } from './types';
import { IAdapter, ITypeConfig, IWhere, IWhereUnique } from './adapter/types';
import { getLeafPath } from './utils';

export class I18n {
  private adapter: IAdapter;
  private typeConfig: ITypeConfig;
  private types: string[];
  private defaultLang: string;

  constructor(options: II18nConstructorOptions) {
    const { adapter, typeConfig, defaultLang } = options;
    this.checkTypeConfig(typeConfig);

    this.adapter = adapter;
    this.typeConfig = typeConfig;
    this.types = Object.keys(typeConfig);
    this.defaultLang = defaultLang;
  }

  public async sync(where: IWhereUnique, data: Record<string, string>, language: string) {
    this.checkType(where.type);
    this.checkData(where.type, data);

    language = language ? language : this.defaultLang;
    const result = await this.adapter.findOne(where, language);
    if (result) {
      await this.adapter.update(where, data, language);
    } else {
      await this.adapter.create(where, data, language);
    }
  }

  public async find(where: IWhere, language: string) {
    this.checkType(where.type);

    language = language ? language : this.defaultLang;
    let results = await this.adapter.find(where, language);

    const missingIds = [];
    where.ids.map(id => {
      if (!results[id]) {
        missingIds.push(id);
      }
    });

    if (!isEmpty(missingIds) && language !== this.defaultLang) {
      const missingResults = await this.adapter.find({ ids: missingIds, type: where.type}, this.defaultLang);
      results = { ...results, ...missingResults };
    }

    return results;
  }

  public async findOne(where: IWhereUnique, language: string) {
    this.checkType(where.type);

    language = language ? language : this.defaultLang;
    let result = await this.adapter.findOne(where, language);
    if (!result) {
      result = await this.adapter.findOne(where, this.defaultLang);
    }
    return result;
  }

  public async destroy(where: IWhereUnique, language: string) {
    this.checkType(where.type);

    language = language ? language : this.defaultLang;
    return this.adapter.destroy(where, language);
  }

  public middleware<TSource = any, TArgs = any, TContext = any>() {
    const i18nMiddleware = async (resolve, root: TSource, args: TArgs, context: TContext, info: GraphQLResolveInfo) => {
      const result = await resolve(root, args, context, info);
      if (info.parentType.name === 'Query') {
        const returnType = info.returnType.toString().replace(/[\[\]!]/g, '');
        const directive = isEmpty(info.fieldNodes)
          ? null
          : info.fieldNodes[0].directives.find(o => o.name.value === 'locale');

        if (!directive || !this.typeConfig[returnType] || isNil(result)) {
          return result;
        }

        const langArg = find(directive.arguments, o => o.name.value === 'lang');
        const lang = (langArg.value as StringValueNode).value;

        if (Array.isArray(result)) {
          const ids = result.map(o => this.typeConfig[returnType].idFromObject(o));
          const where = { type: returnType, ids };
          const i18nResult = await this.find(where, lang);
          if (isEmpty(i18nResult)) {
            return result;
          }

          return result.map(obj => {
            const id = this.typeConfig[returnType].idFromObject(obj);
            return isNil(i18nResult[id])
              ? obj
              : {
                ...obj,
                __i18n: i18nResult[id],
              };
          });
        } else {
          const id = this.typeConfig[returnType].idFromObject(result);
          const where = { type: returnType, id };
          const i18nResult = await this.findOne(where, lang);
          return isNil(i18nResult)
            ? result
            : {
              ...result,
              __i18n: i18nResult,
            };
        }
      }

      const isLeaf = isEmpty(info.fieldNodes)
        ? false
        : isNil(info.fieldNodes[0].selectionSet)
          ? true
          : false;
      const i18nObj = (root as any).__i18n;

      if (isLeaf && !isNil(i18nObj)) {
        let leafResult = i18nObj;
        const leafPath = getLeafPath(info.path);
        for (const path of leafPath) {
          if (isNil(leafResult)) {
            break;
          }
          leafResult = leafResult[path];
        }

        return isNil(leafResult)
          ? result
          : leafResult;
      } else if (!isNil(i18nObj)) {
        return {
          ...result,
          __i18n: i18nObj,
        };
      }

      return result;
    };

    function generateMiddleware(): IMiddlewareFunction {
      return i18nMiddleware;
    }
    return middleware(generateMiddleware);
  }

  private checkTypeConfig(typeConfig: ITypeConfig) {
    Object.keys(typeConfig).map(key => {
      if (!isFunction(typeConfig[key].idFromObject)) {
        throw Error(`typeConfig ${key} does not have \`idFromObject\` function.`);
      }

      if (!Array.isArray(typeConfig[key].fields)) {
        throw Error(`typeConfig ${key}'s fields ${typeConfig[key].fields} is not array.`);
      }

      if (isEmpty(typeConfig[key].fields)) {
        throw new Error(`typeConfig is empty for key ${key}`);
      }
    });
  }

  private checkType(type: string) {
    if (this.types.indexOf(type) === -1) {
      throw Error(`Type ${type} not found.`);
    }
  }

  private checkData(type: string, data: Record<string, any>) {
    const flattenData = flatten(data);
    const flattenDataKeys = Object.keys(flattenData);
    if (!isEqual(flattenDataKeys.sort(), this.typeConfig[type].fields.sort())) {
      throw Error(
        `Data keys ${flattenDataKeys.sort()} is not equal to typeConfig ${this.typeConfig[type].fields.sort()}`);
    }
  }
}

import { flatten } from 'flat';
import { find, isEmpty , isEqual, isFunction, isNil, uniq } from 'lodash';
import { GraphQLResolveInfo, StringValueNode } from 'graphql';
import { middleware, IMiddlewareFunction, } from 'graphql-middleware';

import { II18nConstructorOptions } from './types';
import { IAdapter, ITypeConfig, IWhere, IWhereUnique, IResolverConfig } from './adapter/types';
import { getLeafPath, getDataFromPath, insertI18nByPath } from './utils';

export class I18n {
  private adapter: IAdapter;
  private typeConfig: ITypeConfig;
  private resolverConfig: IResolverConfig;
  private types: string[];
  private resolvers: string[];
  private defaultLang: string;

  constructor(options: II18nConstructorOptions) {
    const { adapter, typeConfig, resolverConfig, defaultLang } = options;
    this.checkTypeConfig(typeConfig);
    this.types = Object.keys(typeConfig);

    this.checkResolverConfig(resolverConfig);

    this.adapter = adapter;
    this.typeConfig = typeConfig;
    this.resolverConfig = resolverConfig;
    this.resolvers = Object.keys(this.resolverConfig.Query);
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

      if (info.parentType.name === 'Query' && this.resolvers.includes(info.fieldName)) {
        const directive = isEmpty(info.fieldNodes)
          ? null
          : info.fieldNodes[0].directives.find(o => o.name.value === 'locale');

        if (!directive || isNil(result)) {
          return result;
        }

        const langArg = find(directive.arguments, o => o.name.value === 'lang');
        const lang = (langArg.value as StringValueNode).value;

        let i18nResult;
        const dataType = this.resolverConfig.Query[info.fieldName].dataType;
        const dataPath = this.resolverConfig.Query[info.fieldName].dataPath;
        const targetData = getDataFromPath(result, dataPath);
        if (isEmpty(targetData)) {
          return result;
        }

        const idFromObject = this.typeConfig[dataType].idFromObject;
        if (Array.isArray(targetData)) {
          const ids = targetData.map(o => idFromObject(o));
          const where = { type: dataType, ids };
          i18nResult = await this.find(where, lang);
        } else {
          const id = idFromObject(targetData);
          const where = { type: dataType, id };
          i18nResult = await this.findOne(where, lang);
        }

        return isEmpty(i18nResult)
          ? result
          : insertI18nByPath(result, i18nResult, dataPath, idFromObject);
      }

      const isLeaf = isEmpty(info.fieldNodes)
        ? false
        : isNil(info.fieldNodes[0].selectionSet)
          ? true
          : false;
      const i18nObj = (root as any).__i18n;
      const i18nLastPath = (root as any).__i18nLastPath;

      if (isLeaf && !isNil(i18nObj)) {
        let leafResult = i18nObj;
        const leafPath = getLeafPath(info.path, i18nLastPath);
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
          __i18nLastPath: i18nLastPath,
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

  private checkResolverConfig(resolverConfig: IResolverConfig) {
    Object.keys(resolverConfig.Query).map(key => {
      if (!this.types.includes(resolverConfig.Query[key].dataType)) {
        throw Error(`resolverConfig ${key}'s data type does not exist in typeConfig.`);
      }

      const dataPath = resolverConfig.Query[key].dataPath;
      if (dataPath) {
        const pathFragments = dataPath.split('.');
        pathFragments.map(pathFragment => {
          if (pathFragment === '') {
            throw Error(`resolverConfig ${key}'s data path ${dataPath} is not valid.`);
          }
        });
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

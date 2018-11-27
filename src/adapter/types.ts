export interface IAdapter {
  create(where: IWhereUnique, data: Record<string, any>, language: string): Promise<any>;
  update(where: IWhereUnique, data: Record<string, any>, language: string): Promise<any>;
  find(where: IWhere, language: string): Promise<Record<string, any>>;
  findOne(where: IWhereUnique, language: string): Promise<null | Record<string, any>>;
  destroy(where: IWhereUnique, language: string): Promise<void>;
}

export interface ITypeConfig {
  [key: string]: {
    idFromObject: (object: any) => string;
    fields: string[];
  };
}

interface IResolverConfig {
  Query: {
    [key: string]: {
      returnType: string;
      objectFromResolve: (resolveResult: any) => any | any[];
    },
  };
}

export interface IWhereUnique {
  id: string;
  type: string;
}

export interface IWhere {
  ids: string[];
  type: string;
}

import { IAdapter, ITypeConfig, IResolverConfig } from './adapter/types';

export interface II18nConstructorOptions {
  adapter: IAdapter;
  typeConfig: ITypeConfig;
  resolverConfig: IResolverConfig;
  defaultLang: string;
}

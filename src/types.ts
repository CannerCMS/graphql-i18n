import { IAdapter, ITypeConfig } from './adapter/types';

export interface II18nConstructorOptions {
  adapter: IAdapter;
  typeConfig: ITypeConfig;
  defaultLang: string;
}

import { IAdapterParam, ISchema } from './adapter/types';

export interface II18nConstructorOptions {
  adapter: IAdapterParam;
  schema: ISchema;
  defaultLang: string;
}

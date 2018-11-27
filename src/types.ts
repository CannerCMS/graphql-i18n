import { IAdapter, ISchema } from './adapter/types';

export interface II18nConstructorOptions {
  adapter: IAdapter;
  schema: ISchema;
  defaultLang: string;
}

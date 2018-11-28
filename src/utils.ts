import { flatten } from 'flat';
import { isEmpty, isNil, isNumber, isUndefined, uniq } from 'lodash';
import * as objectPath from 'object-path';

export const getLeafPath = (path: any, lastKey: string, result: string[] = []) => {
  if (isUndefined(path.prev) || path.key === lastKey || isNumber(path.key)) {
    return result.reverse();
  } else {
    result.push(path.key);
    return getLeafPath(path.prev, lastKey, result);
  }
};

export const getDataFromPath = (source: any, path: string) => {
  let data = source;
  if (isEmpty(path)) {
    return data;
  }

  path = path.replace(/[\[\]]/g, '');
  const pathFragments = path.split('.');
  for (const pathFragment of pathFragments) {
    if (isNil(data)) {
      return data;
    }

    if (Array.isArray(data)) {
      data = data
        .filter(dataChip => !isNil(dataChip[pathFragment]))
        .map(dataChip => dataChip[pathFragment]);
    } else {
      data = data[pathFragment];
    }
  }

  return data;
};

export const insertI18nByPath = (
  source: any,
  i18nObj: any,
  path: string,
  idFromObject: (o: any) => any,
) => {
  const lastPath = isEmpty(path)
    ? ''
    : path.split('.').slice(-1)[0];

  if (isEmpty(path)) {
    return Array.isArray(source)
      ? source.map(o => {
        const id = idFromObject(o);
        return isNil(i18nObj[id])
          ? o
          : {
            ...o,
            __i18n: i18nObj[id],
            __i18nLastPath: lastPath,
          };
      })
      : {
        ...source,
        __i18n: i18nObj,
        __i18nLastPath: lastPath,
      };
  }

  const pathRegExp = Array.isArray(source)
    ? new RegExp(`^\\d+.${path.replace(/\]/g, '\\d+').replace(/\[/g, '.')}`)
    : new RegExp(`^${path.replace(/\]/g, '\\d+').replace(/\[/g, '.')}`);

  let flattenKeyPaths = Object.keys(flatten(source))
    .filter(o => pathRegExp.test(o))
    .map(o => o.match(pathRegExp)[0]);
  flattenKeyPaths = uniq(flattenKeyPaths);

  if (!Array.isArray(getDataFromPath(source, path))) {
    const replaceObj = objectPath.get(source, flattenKeyPaths[0]);
    replaceObj.__i18n = i18nObj;
    replaceObj.__i18nLastPath = lastPath;
    objectPath.set(source, flattenKeyPaths[0], replaceObj);
  } else {
    flattenKeyPaths.map(flattenKeyPath => {
      const replaceObj = objectPath.get(source, flattenKeyPath);
      const id = idFromObject(replaceObj);
      if (!isNil(i18nObj[id])) {
        replaceObj.__i18n = i18nObj[id];
        replaceObj.__i18nLastPath = lastPath;
      }

      objectPath.set(source, flattenKeyPath, replaceObj);
    });
  }

  return source;
};

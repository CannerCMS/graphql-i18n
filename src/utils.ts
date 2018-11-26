import { isUndefined, isNumber } from 'lodash';

export const getLeafPath = (path: any, result: string[] = []) => {
  if (isUndefined(path.prev) || isNumber(path.key)) {
    return result.reverse();
  } else {
    result.push(path.key);
    return getLeafPath(path.prev, result);
  }
};

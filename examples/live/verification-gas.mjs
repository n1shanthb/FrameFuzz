import { liveCases } from './cases.mjs';
export const cases = () => liveCases('basic', [
  { suffix: 'below', value: 67199 }, { suffix: 'at', value: 67200 }, { suffix: 'above', value: 67201 },
]);

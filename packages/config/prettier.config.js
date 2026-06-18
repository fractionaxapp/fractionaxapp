// Re-export of the root Prettier config so submodules can depend on it explicitly:
// `export { default } from '@fractionax/config/prettier';`
/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  arrowParens: 'always',
  endOfLine: 'lf',
};

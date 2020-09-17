import getOptions from './getOptions';
import cacheLoader from './cacheLoader';
import { loader } from 'webpack'
// eslint-disable-next-line import/no-extraneous-dependencies
import { RawSourceMap } from 'source-map';
import { Linter } from './linter';

const fn: loader.Loader = function (content: string | Buffer, map?: RawSourceMap) {
  console.log(`ESLint Loader: ${this.resourcePath}`)
  const options = getOptions(this);
  const linter = new Linter(this, options);

  this.cacheable();

  // return early if cached
  // @ts-ignore
  if (options.cache) {
    cacheLoader(linter, content.toString(), map);
    return;
  }
  const { report, ast} = linter.lint(content);
  console.log({ast})
  report && linter.printOutput(report);
  /// @ts-ignore
  this.callback(null, content, map);
}

export default fn

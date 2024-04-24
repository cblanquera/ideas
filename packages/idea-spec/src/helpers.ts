import type { Data } from '@ossph/idea';
import { Loader } from '@ossph/idea';

export const toValidator: Record<string, string> = {
  String: 'string',
  Text: 'string',
  Number: 'number',
  Integer: 'integer',
  Float: 'float',
  Boolean: 'boolean',
  Date: 'date',
  Datetime: 'date',
  Time: 'date',
  Json: 'object',
  Object: 'object',
  Hash: 'object'
};

/**
 * Converts a string into camel format
 * ie. "some string" to "someString"
 */
export function camelize(string: string) {
  return lowerize(
    string.trim()
      //replace special characters with underscores
      .replace(/[^a-zA-Z0-9]/g, '_')
      //replace multiple underscores with a single underscore
      .replace(/_{2,}/g, '_')
      //trim underscores from the beginning and end of the string
      .replace(/^_+|_+$/g, '')
      //replace underscores with capital
      .replace(/([-_][a-z0-9])/ig, ($1) => {
        return $1.toUpperCase()
          .replace('-', '')
          .replace('_', '');
      })
  );
}

/**
 * Converts a word into capital format
 * ie. "title" to "Title"
 */
export function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Converts a word into lower format
 * ie. "Title" to "title"
 */
export function lowerize(word: string) {
  return word.charAt(0).toLowerCase() + word.slice(1);
}

/**
 * Returns the actual value even if it is an environment variable
 * ex. output "./modules/types.ts"
 * ex. output "env(OUTPUT)"
 */
export function enval<T = Data>(value: Data) {
  const string = (value || '').toString();
  const type = string.indexOf('env(') === 0 ? 'env': 'literal';
  const deconstructed = type === 'env' 
    ? string.replace('env(', '').replace(')', '')
    : value as T;
  return { type, value: deconstructed };
};

/**
 * Returns the absolute path of a file considering environment variables
 */
export function ensolute(output: string, cwd: string) {
  const path = enval<string>(output);
  return path.type === 'env' 
    ? process.env[path.value]
    : Loader.absolute(path.value, cwd);
}
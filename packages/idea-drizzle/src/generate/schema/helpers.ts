import type { Column } from 'idea-spec';
import type { Relations } from './types';

export function clen(column: Column) {
  //if is.ceq, is.cgt, is.clt, is.cge, is.cle
  const length: [ number, number ] = [ 0, 255 ];
  column.assertions.forEach(assertion => {
    if (assertion.method === 'ceq') {
      length[0] = assertion.args[0] as number;
      length[1] = assertion.args[0] as number;
    } else if (assertion.method === 'cgt') {
      length[0] = assertion.args[0] as number;
    } else if (assertion.method === 'clt') {
      length[1] = assertion.args[0] as number;
    } else if (assertion.method === 'cge') {
      length[0] = assertion.args[0] as number;
    } else if (assertion.method === 'cle') {
      length[1] = assertion.args[0] as number;
    }
  });
  //if length is less than 1, then 
  //it's invalid so set to 255
  if (length[1] < 1) {
    length[1] = 255;
  }
  return length;
}

export function numdata(column: Column) {
  const minmax: [ number, number ] = [ 0, 0 ];
  column.assertions.forEach(assertion => {
    if (assertion.method === 'eq') {
      minmax[0] = assertion.args[0] as number;
      minmax[1] = assertion.args[0] as number;
    } else if (assertion.method === 'gt') {
      minmax[0] = assertion.args[0] as number;
    } else if (assertion.method === 'lt') {
      minmax[1] = assertion.args[0] as number;
    } else if (assertion.method === 'ge') {
      minmax[0] = assertion.args[0] as number;
    } else if (assertion.method === 'le') {
      minmax[1] = assertion.args[0] as number;
    }
  });

  //determine the length of each min/max
  const minIntegerLength = minmax[0].toString().split('.')[0].length;
  const maxIntegerLength = minmax[1].toString().split('.')[0].length;
  const minDecimalLength = (minmax[0].toString().split('.')[1] || '').length;
  const maxDecimalLength = (minmax[1].toString().split('.')[1] || '').length;
  //check for @step(0.01)
  const step = Array.isArray(column.attributes.step) 
    ? column.attributes.step[0] as number
    : 0;
  const stepIntegerLength = step.toString().split('.')[0].length;
  const stepDecimalLength = (step.toString().split('.')[1] || '').length;
  const integerLength = Math.max(
    minIntegerLength, 
    maxIntegerLength, 
    stepIntegerLength
  );
  const decimalLength = Math.max(
    minDecimalLength, 
    maxDecimalLength, 
    stepDecimalLength
  );

  return {
    step,
    minmax,
    minIntegerLength, 
    maxIntegerLength,
    minDecimalLength,
    maxDecimalLength,
    stepIntegerLength,
    stepDecimalLength,
    integerLength,
    decimalLength
  };
}

export function attr(column: Column, relations: Relations) {
  const attributes: { name: string, args: string[] }[] = [];
  if (column.required) {
    attributes.push({ name: 'notNull', args: [] });
  }
  if (typeof column.default !== 'undefined') {
    if (column.default === 'now()') {
      attributes.push({ name: 'default', args: ['sql`now()`'] });
    } else if (column.default === 'cuid()') {
      attributes.push({ name: '$default', args: ['() => cuid()'] });
    } else if (column.default === 'nanoid()') {
      attributes.push({ name: '$default', args: ['() => nanoid()'] });
    } else if (typeof column.default === 'string' 
      && /^nanoid\(\d+\)$/.test(column.default)
    ) {
      const match = column.default.match(/^nanoid\((\d+)\)$/);
      attributes.push({ 
        name: '$default', 
        args: [`() => nanoid(${match?.[1]??''})`] 
      });
    } else if (typeof column.default === 'string') {
      attributes.push({ name: 'default', args: [ `'${column.default}'` ] });
    } else {
      attributes.push({ name: 'default', args: [ `${column.default}` ] });
    }
  }
  if (column.attributes.autoincrement) {
    attributes.push({ name: 'autoincrement', args: [] });
  }

  if (relations[column.name]) {
    attributes.push({ name: 'references', args: [
      `() => ${
        relations[column.name].foreignTable
      }.${
        relations[column.name].foreignId
      }`
    ] });
  }
  return attributes;
}
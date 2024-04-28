//types
import type { Column } from 'idea-spec';
import type { Method, Relations } from './types';
//helpers
import { map } from '../../helpers';
import { numdata, attr } from './helpers';

export default function sqlite(column: Column, relations: Relations) {
  const type = map.sqlite[column.type];
  if (!type && !column.fieldset && !column.enum) {
    return [] as Method[];
  }

  let method: Method = { name: type, args: [ `'${column.name}'` ] };

  //char, varchar
  if (type === 'string') {
    if (column.type === 'Json' 
      || column.type === 'Object' 
      || column.type === 'Hash'
    ) {
      method = { 
        name: 'text', 
        args: [ 
          `'${column.name}'`, 
          "{ mode: 'json' }" 
        ] 
      };
    } else {
      method = { name: 'text', args: [ `'${column.name}'` ] };
    }
  //integer, smallint, bigint, float
  } else if (type === 'number') {
    const { decimalLength } = numdata(column);
    if (column.type === 'Boolean') {
      method = { 
        name: 'integer', 
        args: [ `'${column.name}'`, "{ mode: 'boolean' }" ] 
      };
    } else if (column.type === 'Float' || decimalLength > 0) {
      method = { name: 'real', args: [ `'${column.name}'` ] };
    } else {
      method = { name: 'integer', args: [ `'${column.name}'` ] };
    }
    //if it's a type
  } else if (column.fieldset) {
    method = { 
      name: 'text', 
      args: [ 
        `'${column.name}'`, 
        "{ mode: 'json' }" 
      ] 
    };
  } else if (column.enum) {
    method = { name: 'text', args: [ `'${column.name}'` ] };
  }

  return [ method, ...attr(column, relations) ];
}
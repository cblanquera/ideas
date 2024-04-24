//types
import type { PluginWithCLIProps } from '@ossph/idea';
//project
import { Model, Fieldset, Enum } from '@blanquera/idea-spec';
//transformers
import enumGenerator from './generate/enums';
import typeGenerator from './generate/types';

// Sample idea config
// plugin "@blanquera/idea-typescript" {
//   lang "ts"
//   enums "./modules/enums.ts"
//   types "./modules/types.ts"
// }
// or 
// plugin "@blanquera/idea-typescript" {
//   lang "ts"
//   enums "./modules/[name].ts"
//   types "./modules/[name]/types.ts"
// }
// or 
// plugin "@blanquera/idea-typescript" {
//   lang "ts"
//   enums "env(ENUMS)"
//   types "env(TYPES)"
// }

/**
 * This is the The params comes form the cli
 */
export default function generate({ config, schema, cli }: PluginWithCLIProps) {
  const { enums, types, lang = 'ts' } = config
  //populate model cache
  for (const name in schema.model) {
    Model.add(schema.model[name]);
  }
  //populate fieldset cache
  for (const name in schema.type) {
    Fieldset.add(schema.type[name]);
  }
  //populate enum cach
  for (const name in schema.enum) {
    Enum.add(name, schema.enum[name]);
  }
  //if there is an enum output path
  if (typeof config.enums === 'string') {
    //generate enums
    enumGenerator(enums as string, lang as string, cli);
  } 
  //if there is a type output path
  if (typeof config.types === 'string') {
    //generate typescript
    typeGenerator(types as string, lang as string, cli, enums as string|undefined);
  }
};
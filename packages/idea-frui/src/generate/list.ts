//types
import type { Directory } from 'ts-morph';
import type { Model } from 'idea-spec';
//helpers
import { 
  map, 
  capitalize,
  camelize,
  format as getFormat, 
  formatCode 
} from '../helpers';

export default function generate(
  project: Directory, 
  model: Model,
  filename: string
) {
  //loop through all the columns
  model.columns.forEach(column => {
    //get the column format
    const format = getFormat(column.list);
    //skip if no component
    if (!format.component) return;
    //get the path where this should be saved
    const capital = capitalize(camelize(column.name));
    const path = model.destination(
      `${filename}/list/${capital}Format.tsx`.replaceAll('//', '/')
    );
    const source = project.createSourceFile(path, '', { overwrite: true });
    //import Text from 'frui/formats/Text';
    source.addImportDeclaration({
      moduleSpecifier: `frui/formats/${format.component}`,
      defaultImport: format.component as string
    });
    //export function NameFormat() {
    source.addFunction({
      isDefaultExport: true,
      name: `${capital}Format`,
      parameters: [
        { 
          name: 'props', 
          type: `{ value: ${map[column.type]}${column.multiple ? '[]': ''} }` 
        }
      ],
      statements: formatCode(`
        //props
        const { value } = props;
        const attributes = ${JSON.stringify(format.attributes)};
        //render
        return (
          <${format.component} {...attributes} value={value} />
        );
      `)
    });
  });
};
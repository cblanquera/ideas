//types
import type { Directory } from 'ts-morph';
//helpers
import { Model } from 'idea-spec';
import { 
  capitalize,
  camelize,
  field as getField, 
  formatCode 
} from '../helpers';

export default function generate(
  project: Directory, 
  model: Model,
  filename: string
) {
  //loop through all the columns
  model.columns.forEach(column => {
    //get the field of the column
    const field = getField(column.field);
    //skip if no component
    if (!field.component) return;
    //get the path where this should be saved
    const capital = capitalize(camelize(column.name));
    const path = model.destination(
      `${filename}/form/${capital}Field.tsx`.replaceAll('//', '/')
    );
    const source = project.createSourceFile(path, '', { overwrite: true });
    //import Control from 'frui/Control';
    source.addImportDeclaration({
      moduleSpecifier: 'frui/Control',
      defaultImport: 'Control'
    });
    //import Input from 'frui/fields/Input';
    source.addImportDeclaration({
      moduleSpecifier: `frui/fields/${field.component}`,
      defaultImport: field.component as string
    });
    //export function NameField(props: FieldProps) {
    source.addFunction({
      isExported: true,
      name: `${capital}Field`,
      parameters: [
        { 
          name: 'props', 
          type: formatCode(`{
            className?: string,
            error?: boolean,
            value: any,
            change: (name: string, value: any) => void
          }`)
        }
      ],
      statements: formatCode(`
        //props
        const { value, change, error = false } = props;
        const attributes = ${JSON.stringify(field.attributes)};
        ${field.component === 'Select' 
          ? (() => {
            const options = (field.args?.[0] || []) as {
              value: string;
              label: string;
            }[];
            return `const options = ${JSON.stringify(options, null, 2)};`;
          })()
          : ''}
        //render
        return (
          ${field.component === 'Metadata' 
            ? `<${field.component} 
              {...attributes}
              error={error} 
              defaultValue={value} 
              onUpdate={value => change('${column.name}', Object.fromEntries(value))}
            />`
            : field.component === 'Textlist' 
            ? `<${field.component} 
              {...attributes}
              error={error} 
              defaultValue={value} 
              onUpdate={value => change('${column.name}', value)}
            />`
            : field.component === 'Country'
            ? `<${field.component} 
              {...attributes}
              error={error} 
              defaultValue={value} 
              onUpdate={value => change('${column.name}', value.countryCode)}
            />`
            : field.component === 'Currency'
            ? `<${field.component} 
              {...attributes}
              error={error} 
              defaultValue={value} 
              onUpdate={value => change('${column.name}', value.currencyCode)}
            />`
            : field.component === 'Select' 
            ? `<${field.component} 
              {...attributes}
              error={error} 
              options={options}
              defaultValue={value} 
              onUpdate={value => change('${column.name}', value)}
            />`
            : `<${field.component} 
              {...attributes}
              error={error} 
              defaultValue={value} 
              onUpdate={value => change('${column.name}', value)}
            />`
          }
        );
      `)
    });
    //export function NameControl(props: ControlProps) {
    source.addFunction({
      isExported: true,
      name: `${capital}Control`,
      parameters: [
        { 
          name: 'props', 
          type: formatCode(`{
            className?: string,
            error?: string,
            label?: string,
            value: any,
            change: (name: string, value: any) => void
          }`) 
        }
      ],
      statements: formatCode(`
        //props
        const { 
          className, 
          value, 
          change, 
          error, 
          label = '${column.label}' 
        } = props;
        //render
        return (
          <Control label={label} error={error}>
            <${capital}Field
              className={className}
              error={!!error} 
              value={value} 
              change={change}
            />
          </Control>
        );
      `)
    });
  });
};
// This a geeral component map used to configure fields, validators, and 
// formats defined inside a schema.exma file.
import fields from './fields.json';
import formats from './formats.json';

// These are the possible fields that can be defined 
// in schema.exma ie. `@field.text`
export type FieldMethod = 'active' 
  | 'autocomplete' | 'checkbox'  | 'checklist' 
  | 'code'         | 'color'     | 'country' 
  | 'created'      | 'currency'  | 'date'
  | 'datetime'     | 'email'     | 'fieldset'
  | 'file'         | 'filelist'  | 'image'
  | 'imagelist'    | 'input'     | 'integer'
  | 'json'         | 'mask'      | 'metadata'
  | 'none'         | 'number'    | 'password'
  | 'phone'        | 'price'     | 'radio'        
  | 'radiolist'    | 'range'     | 'rating'
  | 'select'       | 'slider'    | 'slug'
  | 'small'        | 'switch'    | 'table'
  | 'tags'         | 'text'      | 'textarea'
  | 'textlist'     | 'time'      | 'updated'
  | 'url'          | 'wysiwyg'   | 'relation';

// These are the possible formatters that can be defined
// in schema.exma `@list.link({ target '_blank'})`
export type FormatMethod = 'captal' 
  | 'char'     | 'color'    | 'comma'
  | 'country'  | 'currency' | 'date' 
  | 'carousel' | 'email'    | 'escaped'  
  | 'formula'  | 'hide'     | 'html'     
  | 'image'    | 'json'     | 'line'  
  | 'link'     | 'list'     | 'lower'
  | 'markdown' | 'metadata' | 'none'
  | 'number'   | 'ol'       | 'pretty' 
  | 'price'    | 'phone'    | 'rating'  
  | 'rel'      | 'relative' | 'space' 
  | 'table'    | 'tags'     | 'text'  
  | 'ul'       | 'upper'    | 'word' 
  | 'yesno'    | 'detail';

//column options

// This is the output format for the @field.text, @list.text options from a 
// column in a model in schema.exma
export type ColumnOption = { 
  component: string|false, 
  attributes: Record<string, any>
};

// This is a list of all defined fields, validators,  
// and formats this code will understand
const config = {
  fields: fields as Record<string, ColumnOption>,
  formats: formats as Record<string, ColumnOption>,
  validators: [
    'required', 'notempty', 'eq',      'ne',      'option', 'regex', 
    'date',     'future',   'past',    'present', 'number', 'float', 
    'price',    'integer',  'boolean', 'gt',      'ge',     'lt', 
    'le',       'ceq',      'cgt',     'cge',     'clt',    'cle', 
    'wgt',      'wge',      'wlt',     'wle',     'cc',     'email', 
    'hex',      'color',    'url',     'string',  'object', 'array'
  ]
};

export default config;
const safeValue = (value: any) => {
  return typeof value !== 'undefined' ? value: '';
}

const assert: Record<string, (value: any, ...args: any[]) => boolean> = {
  //general
  required(value: any) {
    return value !== null && typeof value !== 'undefined';
  },
  notempty(value: any) {
    if (Array.isArray(value)) {
      return value.length > 0;
    } else if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    } else if (typeof value === 'number') {
      return value !== 0;
    }
    return safeValue(value).toString().length > 0;
  },
  eq(value: any, compare: any) { 
    return value == compare;
  },
  ne(value: any, compare: any) { 
    return value != compare;
  },
  option(value: any, options: any[]) { 
    return options.includes(value);
  },
  regex(value: any, regex: string|RegExp) { 
    return new RegExp(regex).test(safeValue(value).toString());
  },
  //date
  date(value: any) { 
    if (value instanceof Date) {
      return true;
    }
    return new Date(value).toString() !== 'Invalid Date';
  },
  future(value: any) { 
    return assert.date(value) && new Date(value || 0) > new Date();
  },
  past(value: any) { 
    return assert.date(value) && new Date(value || 0) < new Date();
  },
  present(value: any) { 
    return assert.date(value) 
      && new Date(value || 0).toDateString() === new Date().toDateString();
  },
  //number
  gt(value: number|string, compare: number) { 
    return (Number(value) || 0) > compare;
  },
  ge(value: number|string, compare: number) { 
    return (Number(value) || 0) >= compare;
  },
  lt(value: number|string, compare: number) { 
    return (Number(value) || 0) < compare;
  },
  le(value: number|string, compare: number) { 
    return (Number(value) || 0) <= compare;
  },
  //string
  ceq(value: string|number, compare: number) { 
    return this.eq(safeValue(value).toString().length, compare);
  },
  cgt(value: string|number, compare: number) { 
    return this.gt(safeValue(value).toString().length, compare);
  },
  cge(value: string|number, compare: number) { 
    return this.ge(safeValue(value).toString().length, compare);
  },
  clt(value: string|number, compare: number) { 
    return this.lt(safeValue(value).toString().length, compare);
  },
  cle(value: string|number, compare: number) { 
    return this.le(safeValue(value).toString().length, compare);
  },
  weq(value: string|number, compare: number) { 
    return this.eq(safeValue(value).toString().split(' ').length, compare);
  },
  wgt(value: string|number, compare: number) { 
    return this.gt(safeValue(value).toString().split(' ').length, compare);
  },
  wge(value: string|number, compare: number) { 
    return this.ge(safeValue(value).toString().split(' ').length, compare);
  },
  wlt(value: string|number, compare: number) { 
    return this.lt(safeValue(value).toString().split(' ').length, compare);
  },
  wle(value: string|number, compare: number) { 
    return this.le(safeValue(value).toString().split(' ').length, compare);
  },
  //patterns
  cc(value: any) { 
    return this.regex(value, /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/);
  },
  color(value: any) { 
    return this.regex(value, /^#?([a-f0-9]{6}|[a-f0-9]{3})$/);
  },
  email(value: any) { 
    return this.regex(value, /^(?:(?:(?:[^@,"\[\]\x5c\x00-\x20\x7f-\xff\.]|\x5c(?=[@,"\[\]\x5c\x00-\x20\x7f-\xff]))(?:[^@,"\[\]\x5c\x00-\x20\x7f-\xff\.]|(?<=\x5c)[@,"\[\]\x5c\x00-\x20\x7f-\xff]|\x5c(?=[@,"\[\]\x5c\x00-\x20\x7f-\xff])|\.(?=[^\.])){1,62}(?:[^@,"\[\]\x5c\x00-\x20\x7f-\xff\.]|(?<=\x5c)[@,"\[\]\x5c\x00-\x20\x7f-\xff])|[^@,"\[\]\x5c\x00-\x20\x7f-\xff\.]{1,2})|"(?:[^"]|(?<=\x5c)"){1,62}")@(?:(?!.{64})(?:[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.?|[a-zA-Z0-9]\.?)+\.(?:xn--[a-zA-Z0-9]+|[a-zA-Z]{2,6})|\[(?:[0-1]?\d?\d|2[0-4]\d|25[0-5])(?:\.(?:[0-1]?\d?\d|2[0-4]\d|25[0-5])){3}\])$/);
  },
  hex(value: any) { 
    return this.regex(value, /^[a-f0-9]+$/);
  },
  price(value: any) { 
    return this.regex(value.toString(), /^(\d*.\d{2})|(\d+)$/);
  },
  url(value: any) { 
    return this.regex(value,/^(http|https|ftp):\/\/([A-Z0-9][A-Z0-9_-]*(?:.[A-Z0-9][A-Z0-9_-]*)+):?(d+)?\/?/i);
  },
  //types
  boolean(value: any) {
    return typeof value === 'boolean';
  },
  string(value: any) {
    return typeof value === 'string';
  },
  number(value: any) { 
    return this.regex(value.toString(), /^\d+(\.\d+)*$/);
  },
  float(value: any) { 
    return this.regex(value.toString(), /^\d+\.\d+$/);
  },
  integer(value: any) { 
    return this.regex(value.toString(), /^\d+$/);
  },
  object(value: any) {
    return value !== null 
      && !Array.isArray(value) 
      && value.constructor.name === 'Object';
  },
  array(values: any[], validator: string, ...args: any[]) {
    return values.every(value => assert[validator].apply(assert, [value, ...args]));
  }
};

export default assert;
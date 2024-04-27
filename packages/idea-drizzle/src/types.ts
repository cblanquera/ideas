export type ResponsePayload<T = any> = {
  error: boolean,
  code?: number,
  message?: string, 
  errors?: Record<string, any>,
  results?: T,
  total?: number
};

export type SearchParams = {
  q?: string,
  filter?: Record<string, string|number|boolean>,
  span?: Record<string, (string|number|null|undefined)[]>,
  sort?: Record<string, any>,
  skip?: number,
  take?: number
};

export type ProjectConfig = {
  engine: {
    type: string,
    value: string
  },
  url: {
    type: string,
    value: string
  },
  lang: string,
  paths: {
    types: string,
    assert: string,
    store: string,
    actions: string
  }
};
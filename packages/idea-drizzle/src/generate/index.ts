//types
import type { PluginWithCLIProps } from '@ossph/idea';
import type { ProjectConfig } from '../types';
//project
import { Model, ensolute, enval } from 'idea-spec';
//generators
import generateStore from './store';
import generateActions from './actions';

// Sample idea config
//
// plugin "idea-drizzle" {
//   lang "ts"
//   engine "pg"
//   url "env(DATABASE_URL)"
//   actions "./modules/[name]/actions/[action]"
//   store "./modules/store"
// }
//
// or 
//
// plugin "idea-drizzle" {
//   lang "ts"
//   engine "pg"
//   url "env(DATABASE_URL)"
//   actions "./modules/[name]/actions"
//   store "./modules/store"
// }
//
// or 
//
// plugin "idea-drizzle" {
//   lang "ts"
//   engine "pg"
//   url "env(DATABASE_URL)"
//   actions "./modules/actions"
//   store "./modules/store"
// }

/**
 * This is the The params comes form the cli
 * TODO: Enums, Unqiue
 */
export default function generate({ config, schema, cli }: PluginWithCLIProps) {
  //at a bare minimum, we need store
  if (!config.store) {
    return cli.terminal.error('Missing store path');
  //we also need the engine
  } else if (typeof config.engine !== 'string') {
    return cli.terminal.error('Missing engine');
  //we also need the url
  } else if (typeof config.url !== 'string') {
    return cli.terminal.error('Missing url');
  }
  //if actions are set
  if (config.actions) {
    //actions need output from idea-assert
    if (!schema.plugin?.['idea-assert'].output) {
      return cli.terminal.error('idea-assert plugin is required');
    //need types from idea-ts
    } else if (!schema.plugin?.['idea-ts'].types) {
      return cli.terminal.error('idea-ts plugin is required');
    }
  }

  //determine url
  const url = enval<string>(config.url);
  //determine engine
  const engine = enval<string>(config.engine);
  //determine lang
  const lang = config.lang 
    || schema.plugin?.['idea-assert']?.lang
    || schema.plugin?.['idea-ts']?.lang
    || 'ts';
  //determine absolute paths
  const paths = {
    actions: typeof config.actions === 'string'
      ? ensolute(config.actions as string, cli.cwd)
      : undefined,
    store: typeof config.store === 'string'
      ? ensolute(config.store as string, cli.cwd) as string
      : config.store,
    assert: typeof schema.plugin?.['idea-assert']?.output === 'string'
      ? ensolute(schema.plugin?.['idea-assert']?.output as string, cli.cwd)
      : undefined,
    types: typeof schema.plugin?.['idea-ts']?.types === 'string'
      ? ensolute(schema.plugin?.['idea-ts']?.types as string, cli.cwd)
      : undefined
  }
  //recheck paths
  //at a bare minimum, we need store
  if (!paths.store) {
    return cli.terminal.error('Store path is invalid');
  }
  //if actions are set
  if (config.actions) {
    //if path is invalid
    if (!paths.actions) {
      return cli.terminal.error('Actions path is invalid');
    }
    //actions need output from idea-assert
    if (!paths.assert) {
      return cli.terminal.error('Assert path is invalid');
    }
  }
  //make project config
  const project: ProjectConfig = {
    engine: engine,
    url: url,
    lang: lang as string,
    paths: paths as {
      types: string,
      assert: string,
      store: string,
      actions: string
    }
  };

  //populate model cache
  for (const name in schema.model) {
    Model.add(schema.model[name]);
  }
  //at a bare minimum generate the store
  generateStore(project);
  //if actions path is set
  if (paths.actions) {
    generateActions(project, cli);
  }
};
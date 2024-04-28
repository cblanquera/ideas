//types
import type { Column } from 'idea-spec';
import type { Relations } from './types';
//columns
import postgres from './postgres';
import mysql from './mysql';
import sqlite from './sqlite';

export default function column(column: Column, engine: string, relations: Relations) {
  switch (engine) {
    case 'neon':
    case 'xata':
    case 'postgres':
    case 'pg':
    case 'vercel':
      return postgres(column, relations);
    case 'planetscale':
    case 'mysql':
      return mysql(column, relations);
    case 'sqlite':
      return sqlite(column, relations);
  }

  return [] as { name: string, args: string[] }[];
}
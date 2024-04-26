import { Project, Directory, SourceFile } from 'ts-morph';

export type Projects = Record<string, {
  output: string,
  dirname: string,
  filename: string,
  project: Project,
  source: Directory,
  file?: SourceFile
}>;
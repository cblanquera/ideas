/**
 * A simple code formatter
 */
export function formatCode(code: string): string {
  code = code
    .replace(/\}\s+else\s+if\s+\(/g, '} else if (')
    .replace(/\s*\n\s*\n\s*/g, "\n")
    .trim();
  const lines = code.split("\n");
  let indent = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^\}/g) || line.match(/^\)/g) || line.match(/^<\//g) || line.match(/^\/>/g)) {
      indent -= 2;
    }
    lines[i] = `${' '.repeat(indent >= 0 ? indent: 0)}${line}`;
    if (line.match(/\s*\{\s*$/g) || line.match(/\s*\(\s*$/g) || line.match(/\s*<[a-zA-Z][^>]*>{0,1}\s*$/g)) {
      indent += 2;
    }
  }
  return lines.join("\n");
};
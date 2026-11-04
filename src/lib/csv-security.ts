/** Quoting alone does not stop spreadsheet formula execution. */
export function csvEscape(value: string | number) {
  let text = String(value);
  if (typeof value === "string" && /^[\s\u0000-\u001f]*[=+@-]/u.test(text)) text = `'${text}`;
  if (/[;"\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
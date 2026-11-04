// 문구 속 "{이름}" 자리를 값으로 채운다. 예: fill('{class}반', { class: 3 }) → '3반'
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

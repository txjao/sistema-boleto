import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}
export function money(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}
export function monthLabel(value: string) {
  const [year, month] = value.split('-');
  return `${month}/${year}`;
}
export function dateLabel(value: string) {
  return value.split('-').reverse().join('/');
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação. Tente novamente.';
}
export function digits(value: string) {
  return value.replace(/\D/g, '');
}
export function cnpjRoot(value: string) {
  return digits(value).slice(0, 8);
}
export function cnpjRootLabel(value: string) {
  const root = cnpjRoot(value).padEnd(8, '0');
  return root.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3');
}
export function maskCnpj(value: string) {
  return digits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\/\d{4})(\d)/, '$1-$2');
}
export function maskPhone(value: string) {
  const raw = digits(value).slice(0, 11);
  if (raw.length <= 10)
    return raw
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  return raw
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

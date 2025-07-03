// utils/formatPrice.ts
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,   // pas de décimales
    minimumFractionDigits: 0,
  }).format(value);
}

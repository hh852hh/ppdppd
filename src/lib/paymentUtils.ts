export function formatPrice(price: number): string {
  return `HK$${(price / 100).toFixed(2)}`;
}

export function generateOrderNumber(): string {
  return `ORD${Date.now()}`;
}

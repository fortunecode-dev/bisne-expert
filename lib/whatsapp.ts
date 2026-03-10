import type { CartItem, Product, BusinessDetail, Lang } from '@/types';
import { localizedText } from './data';

export function buildWhatsAppMessage(
  items: CartItem[],
  products: Record<number, Product>,
  business: BusinessDetail,
  lang: Lang = 'es',
  donation?: number
): string {
  const lines: string[] = [];

  if (lang === 'es') {
    lines.push('🛒 *Nuevo Pedido*');
    lines.push('');
  } else {
    lines.push('🛒 *New Order*');
    lines.push('');
  }

  let total = 0;
  for (const item of items) {
    const product = products[item.productId];
    if (!product) continue;
    const name = localizedText(product.name, lang);
    const subtotal = product.price * item.quantity;
    total += subtotal;
    lines.push(`• ${name} x${item.quantity} — ${formatPrice(subtotal, business.currency)}`);
  }

  lines.push('');
  const totalLabel = lang === 'es' ? '*Total:*' : '*Total:*';
  lines.push(`${totalLabel} ${formatPrice(total, business.currency)}`);

  if (donation && donation > 0) {
    const donLabel = lang === 'es' ? '🙏 Propina:' : '🙏 Tip:';
    lines.push(`${donLabel} ${formatPrice(donation, business.currency)}`);
  }

  if (business.address) {
    lines.push('');
    const addrLabel = lang === 'es' ? '📍 Dirección:' : '📍 Address:';
    lines.push(`${addrLabel} ${localizedText(business.address, lang)}`);
  }

  return lines.join('\n');
}

export function buildWhatsAppURL(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function formatPrice(amount: number, currency: string = 'CUP'): string {
  return `${amount.toLocaleString()} ${currency}`;
}

export function buildDonationQRText(business: BusinessDetail, lang: Lang = 'es'): string {
  const prefix = lang === 'es' ? 'TRANSFERMOVIL_ETECSA, TRANSFERENCIA' : 'TRANSFERMOVIL_ETECSA, TRANSFER';
  const card = business.cardNumber || '';
  const phone = business.phone || '';
  return `${prefix}, Tarjeta-${card}, Numero-${phone}`;
}

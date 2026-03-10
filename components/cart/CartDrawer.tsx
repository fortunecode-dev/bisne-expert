'use client';

import { useEffect } from 'react';
import type { CartItem, Product, BusinessDetail, Lang } from '@/types';
import { formatPrice, buildWhatsAppMessage, buildWhatsAppURL } from '@/lib/whatsapp';
import { buildCartParam } from '@/lib/data';
import { getCartTotal } from '@/lib/cart';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  products: Record<number, Product>;
  business: BusinessDetail;
  businessSlug: string;
  lang: Lang;
  onUpdateQuantity: (productId: number, qty: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  products,
  business,
  businessSlug,
  lang,
  onUpdateQuantity,
  onRemove,
  onClear,
}: CartDrawerProps) {
  const currency = business.currency || 'CUP';

  const prices: Record<number, number> = {};
  for (const [id, product] of Object.entries(products)) {
    prices[parseInt(id)] = product.price;
  }

  const total = getCartTotal(items, prices);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleCheckout = () => {
    const message = buildWhatsAppMessage(items, products, business, lang);
    const url = buildWhatsAppURL(business.phone, message);
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const cartParam = buildCartParam(items);
    const url = `${window.location.origin}/view/${businessSlug}?c=${cartParam}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(lang === 'es' ? '¡Enlace copiado!' : 'Link copied!');
    } catch {
      prompt(lang === 'es' ? 'Copia este enlace:' : 'Copy this link:', url);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">
            🛒 {lang === 'es' ? 'Tu Pedido' : 'Your Order'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-5xl mb-3">🛒</span>
              <p className="text-sm font-medium">
                {lang === 'es' ? 'Tu carrito está vacío' : 'Your cart is empty'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const product = products[item.productId];
                if (!product) return null;
                const name = product.name[lang];
                const subtotal = product.price * item.quantity;

                return (
                  <div key={item.productId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatPrice(product.price, currency)} {lang === 'es' ? 'c/u' : 'each'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 font-bold text-sm transition-colors"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 font-bold text-sm transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(subtotal, currency)}</p>
                      <button
                        onClick={() => onRemove(item.productId)}
                        className="text-xs text-red-400 hover:text-red-600 mt-0.5"
                      >
                        {lang === 'es' ? 'Quitar' : 'Remove'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-700">
                {lang === 'es' ? 'Total' : 'Total'}
              </span>
              <span className="text-xl font-black text-gray-900">{formatPrice(total, currency)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span>📲</span>
              {lang === 'es' ? 'Pedir por WhatsApp' : 'Order via WhatsApp'}
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 font-semibold py-2.5 px-3 rounded-xl text-sm transition-all duration-200"
              >
                🔗 {lang === 'es' ? 'Compartir' : 'Share'}
              </button>
              <button
                onClick={onClear}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-red-300 text-gray-500 hover:text-red-500 font-semibold py-2.5 px-3 rounded-xl text-sm transition-all duration-200"
              >
                🗑 {lang === 'es' ? 'Limpiar' : 'Clear'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

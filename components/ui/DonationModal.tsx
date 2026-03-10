'use client';

import { useEffect, useRef } from 'react';
import type { BusinessDetail, Lang } from '@/types';
import { buildDonationQRText } from '@/lib/whatsapp';

interface DonationModalProps {
  business: BusinessDetail;
  lang: Lang;
  onClose: () => void;
}

export default function DonationModal({ business, lang, onClose }: DonationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current) return;
      try {
        const QRCode = await import('qrcode');
        const text = buildDonationQRText(business, lang);
        await QRCode.toCanvas(canvasRef.current, text, {
          width: 200,
          margin: 2,
          color: { dark: '#1f2937', light: '#ffffff' },
        });
      } catch (e) {
        console.error('QR Error:', e);
      }
    };
    generateQR();
  }, [business, lang]);

  const qrText = buildDonationQRText(business, lang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="text-4xl mb-3">🙏</div>
          <h3 className="text-xl font-black text-gray-900 mb-1">
            {lang === 'es' ? 'Apoyar al negocio' : 'Support the business'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {lang === 'es'
              ? 'Escanea el código para donar vía Transfermóvil'
              : 'Scan the code to donate via Transfermóvil'}
          </p>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 font-mono break-all border border-gray-200">
            {qrText}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            {lang === 'es' ? 'Powered by Transfermóvil (ETECSA)' : 'Powered by Transfermóvil (ETECSA)'}
          </p>
        </div>
      </div>
    </div>
  );
}

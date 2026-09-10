'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Shop } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Download, Printer, Copy, Check, AlertTriangle } from 'lucide-react';

interface QrPanelProps {
  shop: Shop;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/*
 * 店頭に貼る QR。読むと店舗詳細（/shop/<id>）に飛び、そこから予約に進む。
 *
 * 予約ページ（/book/<id>）を直接指さないのは、未ログインだとログイン画面に
 * 飛ばされ、何の店か分からないまま認証を求められるため。詳細を挟めば
 * 店舗情報とメニューを見てから予約できる。
 */
export default function QrPanel({ shop, onSuccess, onError }: QrPanelProps) {
  const [qr, setQr] = useState<{ url: string; svg: string; png: string } | null>(null);
  const [copied, setCopied] = useState(false);

  /*
   * 親から渡される onError は毎レンダー新しく作られる。依存配列に入れると
   * 生成 → setState → 再レンダー → 依存が変わる → 再生成 の無限ループになるので、
   * ref 経由で最新版を参照する。
   */
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      // 印刷される QR は、いま開いているドメインを指す
      const target = `${window.location.origin}/shop/${shop.id}`;
      const opts = {
        errorCorrectionLevel: 'M' as const,
        margin: 1,
        color: { dark: '#141A15', light: '#FFFFFF' },
      };
      // 表示と印刷は SVG（拡大しても粗くならない）、保存は PNG
      const [svg, png] = await Promise.all([
        QRCode.toString(target, { ...opts, type: 'svg', width: 320 }),
        QRCode.toDataURL(target, { ...opts, width: 1024 }),
      ]);
      if (!cancelled) setQr({ url: target, svg, png });
    }

    generate().catch(() => {
      if (!cancelled) onErrorRef.current('QR үүсгэхэд алдаа гарлаа');
    });

    return () => {
      cancelled = true;
    };
  }, [shop.id]);

  const handleCopy = async () => {
    if (!qr) return;
    try {
      await navigator.clipboard.writeText(qr.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onError('Хуулж чадсангүй');
    }
  };

  const handleDownload = () => {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr.png;
    a.download = `${shop.name.replace(/\s+/g, '-')}-qr.png`;
    a.click();
    onSuccess('QR татагдлаа');
  };

  const url = qr?.url ?? '';
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">
      {isLocal && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-card print:hidden">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            Энэ QR <strong>localhost</strong> хаяг руу заасан байна. Утаснаас уншихад
            ажиллахгүй. Жинхэнэ хаягаараа нэвтэрч ороод хэвлэнэ үү.
          </p>
        </div>
      )}

      {/* 印刷されるのはこのカードだけ */}
      <Card variant="elevated" className="p-5!">
        <div id="qr-print" className="text-center py-4">
          <h2 className="text-lg font-bold text-ink-strong mb-1">{shop.name}</h2>
          <p className="text-sm text-subtle mb-5">Цаг захиалахын тулд уншуулна уу</p>

          {qr ? (
            <div
              className="inline-block [&>svg]:w-[240px] [&>svg]:h-[240px] md:[&>svg]:w-[280px] md:[&>svg]:h-[280px]"
              dangerouslySetInnerHTML={{ __html: qr.svg }}
            />
          ) : (
            <div className="w-[240px] h-[240px] mx-auto bg-surface animate-pulse rounded-card" />
          )}

          <p className="text-[12px] text-subtle mt-5 break-all">{url}</p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <Button variant="primary" className="flex-1 gap-2" onClick={handleDownload} disabled={!qr}>
          <Download className="w-4 h-4" />
          PNG татах
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          Хэвлэх
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Хуулагдлаа' : 'Холбоос хуулах'}
        </Button>
      </div>

      <Card variant="elevated" className="p-5! print:hidden">
        <h3 className="text-sm font-bold text-ink mb-2">Хаана ашиглах вэ</h3>
        <ul className="text-sm text-subtle space-y-1.5 list-disc pl-5">
          <li>Хэвлээд хүлээлгийн хэсэг, тооцооны ширээн дээр тавих</li>
          <li>Нэрийн хуудас, эмчилгээний картанд хэвлэх</li>
          <li>PNG-г татаад Фэйсбүүк хуудас, зар сурталчилгаанд ашиглах</li>
        </ul>
      </Card>
    </div>
  );
}

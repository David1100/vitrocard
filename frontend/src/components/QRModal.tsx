import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from './ui';
import { Button } from './Button';

export interface QRModalProps {
  salonName: string;
  qrCode: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Muestra el QR del salón apuntando a /s/:code, con descarga PNG e impresión.
 */
export function QRModal({ salonName, qrCode, open, onClose }: QRModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    const url = `${window.location.origin}/s/${qrCode}`;
    setTargetUrl(url);
    let alive = true;
    QRCode.toDataURL(url, {
      width: 480,
      margin: 2,
      color: { dark: '#2b2019ff', light: '#faf6f0ff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (alive) setDataUrl(url);
      })
      .catch(() => {
        if (alive) setDataUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [open, qrCode]);

  if (!open) return null;

  function download() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `vitro-qr-${qrCode}.png`;
    a.click();
  }

  function print() {
    if (!dataUrl) return;
    const win = window.open('', '_blank', 'width=620,height=800');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>QR ${salonName}</title></head>
      <body style="text-align:center;font-family:serif;padding:48px">
        <p style="letter-spacing:6px;color:#6b5647">VITRO · CLUB DE GRATITUD</p>
        <h2 style="font-weight:400;color:#2b2019">${salonName}</h2>
        <img src="${dataUrl}" alt="QR" style="width:340px;height:340px" />
        <p style="color:#8a7461">Escanea para consultar tu tarjeta</p>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <Modal open={open} title={`QR de ${salonName}`} onClose={onClose}>
      <div className="flex flex-col items-center">
        <div className="rounded-2xl border-2 border-cream-300 bg-cream-50 p-4 shadow-soft">
          {dataUrl ? (
            <img src={dataUrl} alt={`Código QR del salón ${salonName}`} className="h-52 w-52" />
          ) : (
            <div className="flex h-52 w-52 items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-cream-300 border-t-clay-500" />
            </div>
          )}
        </div>
        <p className="mt-3 text-center font-display text-lg italic text-ink-900">{salonName}</p>
        <code className="mt-1 rounded-lg bg-cream-200/80 px-3 py-1 text-xs text-ink-700">/s/{qrCode}</code>
        <div className="mt-5 flex w-full gap-3">
          <Button variant="ghost" className="flex-1" onClick={download} disabled={!dataUrl}>
            Descargar PNG
          </Button>
          <Button variant="primary" className="flex-1" onClick={print} disabled={!dataUrl}>
            Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

// ── QR Display ────────────────────────────────────────────────────
export function AddressQR({ address, size = 180 }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 bg-white rounded-2xl shadow-lg">
        <QRCodeSVG value={address} size={size} bgColor="#ffffff" fgColor="#0D1521" level="M" />
      </div>
      <div className="text-center">
        <p className="font-mono text-xs text-slate-400 break-all px-2">{address}</p>
        <button onClick={copy}
          className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium border border-stroke text-slate-400 hover:bg-stroke hover:text-white transition">
          {copied ? "✓ Copied!" : "Copy Address"}
        </button>
      </div>
    </div>
  );
}

// ── QR Scanner ────────────────────────────────────────────────────
export function QRScanner({ onScan, onClose }) {
  const scannerRef  = useRef(null);
  const scannedRef  = useRef(false); // prevent double-fire
  const stoppingRef = useRef(false); // prevent double-stop
  const [error, setError]   = useState(null);
  const [status, setStatus] = useState("Starting camera...");

  useEffect(() => {
    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            // Prevent firing multiple times
            if (scannedRef.current || stoppingRef.current) return;

            let address = decodedText.trim();
            if (address.startsWith("ethereum:")) {
              address = address.split(":")[1].split("@")[0].split("?")[0];
            }

            if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
              scannedRef.current  = true;
              stoppingRef.current = true;
              try {
                await scanner.stop();
              } catch { /* ignore */ }
              onScan(address); // call AFTER stop completes
            } else {
              setStatus("Not a valid Ethereum address — try again.");
            }
          },
          () => {} // ignore frame decode errors
        );
        setStatus("Point camera at a wallet QR code");
      } catch (e) {
        setError("Camera access denied or unavailable. " + e.message);
      }
    }

    startScanner();

    // Cleanup on unmount — only stop if not already stopped
    return () => {
      if (scannerRef.current && !stoppingRef.current) {
        stoppingRef.current = true;
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);  // empty deps — onScan captured via ref below

  // Keep onScan stable via ref so useEffect doesn't re-run
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  async function handleClose() {
    if (scannerRef.current && !stoppingRef.current) {
      stoppingRef.current = true;
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card max-w-sm w-full space-y-4 scale-in">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">Scan Wallet QR</h3>
          <button onClick={handleClose} className="text-slate-500 hover:text-white text-xl leading-none transition">×</button>
        </div>

        {error ? (
          <div className="px-4 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        ) : (
          <>
            <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
            <p className="text-xs text-slate-500 text-center">{status}</p>
          </>
        )}

        <button onClick={handleClose}
          className="w-full py-2.5 rounded-lg border border-stroke text-slate-400 text-sm hover:bg-stroke hover:text-white transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── QR Modal ──────────────────────────────────────────────────────
export function QRModal({ address, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card max-w-xs w-full space-y-4 scale-in text-center">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">Wallet QR Code</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none transition">×</button>
        </div>
        <AddressQR address={address} size={200} />
        <p className="text-xs text-slate-600">Share this QR so others can send you ETH</p>
      </div>
    </div>
  );
}

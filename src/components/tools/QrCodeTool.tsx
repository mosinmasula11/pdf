"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Globe, Mail, MessageCircle, Phone, QrCode, Wifi } from "lucide-react";
import { downloadBlob } from "@/lib/browser-utils";
import { generateQrMatrix } from "@/lib/qr-generator";

type QrType = "url" | "whatsapp" | "wifi" | "text" | "email" | "phone";

export function QrCodeTool() {
  const [qrType, setQrType] = useState<QrType>("url");
  const [url, setUrl] = useState("https://pdf.msyn.in");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [text, setText] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiType, setWifiType] = useState("WPA");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(300);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute final QR payload string based on active tab
  const getPayload = () => {
    switch (qrType) {
      case "url":
        return url.trim() || "https://pdf.msyn.in";
      case "whatsapp": {
        const cleanPhone = whatsappPhone.replace(/[^\d]/g, "");
        if (!cleanPhone) {
          return "https://wa.me/";
        }
        const textQuery = whatsappMessage.trim()
          ? `?text=${encodeURIComponent(whatsappMessage.trim())}`
          : "";
        return `https://wa.me/${cleanPhone}${textQuery}`;
      }
      case "text":
        return text.trim() || "Hello from MSYN Tools";
      case "wifi": {
        const escapeWifi = (str: string) => str.replace(/([\\;,:"])/g, "\\$1");
        return `WIFI:S:${escapeWifi(wifiSsid)};T:${wifiType};P:${escapeWifi(wifiPass)};;`;
      }
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}`;
      case "phone":
        return `tel:${phoneNumber.trim()}`;
    }
  };

  const currentPayload = getPayload();

  const encoded = useMemo(() => {
    try { return { matrix: generateQrMatrix(currentPayload), error: null }; }
    catch { return { matrix: null, error: "This content is too long for a QR code. Shorten it and try again." }; }
  }, [currentPayload]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const matrix = encoded.matrix;
    if (!matrix) { canvas.width = canvas.height = 0; return; }
    canvas.width = canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = bgColor;
    context.fillRect(0, 0, size, size);
    const margin = 4, cell = size / (matrix.length + margin * 2);
    context.fillStyle = fgColor;
    matrix.forEach((row, y) => row.forEach((black, x) => {
      if (black) context.fillRect(Math.floor((x + margin) * cell), Math.floor((y + margin) * cell), Math.ceil(cell), Math.ceil(cell));
    }));
  }, [encoded, fgColor, bgColor, size]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (encoded.error || error) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `qrcode-${Date.now()}.png`);
      else setError("Could not export QR image.");
    }, "image/png");
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      // Fallback if browser doesn't support writing image blob to clipboard
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-violet-100 p-2 text-violet-600">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">QR Code Generator</h2>
          <p className="text-sm text-slate-500">
            Generate high-resolution, custom QR codes for websites, WiFi, and contacts with 100% privacy.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          {/* Preset Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {[
              { type: "url", label: "Website URL", icon: Globe },
              { type: "whatsapp", label: "WhatsApp Chat", icon: MessageCircle },
              { type: "wifi", label: "WiFi Network", icon: Wifi },
              { type: "text", label: "Plain Text", icon: QrCode },
              { type: "email", label: "Email", icon: Mail },
              { type: "phone", label: "Phone", icon: Phone },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setQrType(type as QrType)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  qrType === type
                    ? "bg-violet-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Inputs */}
          <div className="mt-4 space-y-4">
            {qrType === "url" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Enter Website URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                />
              </div>
            )}

            {qrType === "whatsapp" && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    WhatsApp Phone Number (with Country Code)
                  </label>
                  <input
                    type="tel"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="e.g. +1 555 123 4567 or 919876543210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Include country code without any spaces or symbols (e.g., +1 for US, +91 for India, +44 for UK).
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Pre-filled Message (Optional)
                  </label>
                  <textarea
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    rows={3}
                    placeholder="Hi! I'm interested in your product / service..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    When scanned, WhatsApp opens directly with this chat and message ready to send.
                  </p>
                </div>
              </div>
            )}

            {qrType === "text" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Text Message</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder="Type any message, note, or code..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                />
              </div>
            )}

            {qrType === "wifi" && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Network Name (SSID)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="MyHomeWiFi"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">WiFi Password</label>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    placeholder="SecretPassword123"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Security Type</label>
                  <select
                    value={wifiType}
                    onChange={(e) => setWifiType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>
              </div>
            )}

            {qrType === "email" && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Recipient Email</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="hello@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Inquiry / Feedback"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {qrType === "phone" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Color & Size Customization */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">Appearance & Colors</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">QR Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                  />
                  <span className="text-xs font-mono text-slate-600">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                  />
                  <span className="text-xs font-mono text-slate-600">{bgColor}</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Size: {size}px</label>
                <input
                  type="range"
                  min="200"
                  max="800"
                  step="50"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
              </div>
            </div>
          </div>
        </div>

        {(encoded.error || error) && <p role="alert" className="text-sm text-red-600">{encoded.error || error}</p>}
        {/* Live Preview & Actions */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-md">
            <canvas ref={canvasRef} className="h-52 w-52 object-contain" />
          </div>

          <p className="mt-4 max-w-xs truncate text-xs text-slate-500 font-mono">
            {currentPayload}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={Boolean(encoded.error || error)}
              onClick={downloadPng}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
            >
              <Download className="h-3.5 w-3.5" />
              Download PNG
            </button>
            <button
              type="button"
              disabled={Boolean(error)}
              onClick={copyToClipboard}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy Image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


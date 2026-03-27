"use client";

import { useState, useCallback } from "react";
import Cropper, { type CropperProps } from "react-easy-crop";
import type { Area } from "react-easy-crop";

const ASPECT = 800 / 560; // 10:7 — matches reserve page image

async function getCroppedBlob(imageSrc: string, cropPx: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = cropPx.width;
  canvas.height = cropPx.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, cropPx.x, cropPx.y, cropPx.width, cropPx.height, 0, 0, cropPx.width, cropPx.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas empty"))), "image/jpeg", 0.92)
  );
}

interface Props {
  src: string;           // object URL of the selected file
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropModal({ src, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPx, setCroppedAreaPx] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, px: Area) => {
    setCroppedAreaPx(px);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPx) return;
    const blob = await getCroppedBlob(src, croppedAreaPx);
    onConfirm(blob);
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <div className="text-sm font-semibold dark:text-slate-100">Crop image</div>
            <div className="text-xs text-slate-400 mt-0.5">Pan to reposition · Pinch or scroll to zoom</div>
          </div>

          {/* Crop area */}
          <div className="relative w-full" style={{ height: 300 }}>
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { background: "#0f172a" },
              }}
            />
          </div>

          {/* Zoom slider */}
          <div className="px-4 pt-3 pb-1 flex items-center gap-3">
            <span className="text-xs text-slate-400 w-8 text-right">–</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-slate-400 w-8">+</span>
          </div>

          <div className="flex gap-2 p-4">
            <button type="button" onClick={handleConfirm} className="btn btn-primary flex-1">
              Use this crop
            </button>
            <button type="button" onClick={onCancel} className="btn btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

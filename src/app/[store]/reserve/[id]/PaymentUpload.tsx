"use client";

import { useRef, useState } from "react";
import { uploadPaymentProofAction } from "@/app/[store]/reserve/actions";

export function PaymentUpload({
  storeSlug,
  reservationId
}: {
  storeSlug: string;
  reservationId: number;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const proofRef = useRef<HTMLInputElement>(null);
  const mimeRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    setCompressing(true);
    try {
      const { base64, mime } = await compressImage(file);
      if (proofRef.current) proofRef.current.value = base64;
      if (mimeRef.current) mimeRef.current.value = mime;
      setPreview(`data:${mime};base64,${base64}`);
    } catch {
      alert("Failed to process the image. Please try another file.");
    } finally {
      setCompressing(false);
    }
  }

  function clearImage() {
    setPreview(null);
    if (proofRef.current) proofRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form action={uploadPaymentProofAction} className="space-y-4">
      <input type="hidden" name="storeSlug" value={storeSlug} />
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="proof" ref={proofRef} />
      <input type="hidden" name="mime" ref={mimeRef} />

      <div
        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition"
        onClick={() => fileInputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {compressing ? (
          <p className="text-sm text-slate-500">Compressing image…</p>
        ) : preview ? (
          <img src={preview} alt="Payment proof preview" className="max-h-56 mx-auto rounded-lg object-contain" />
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-slate-600 font-medium">Click or drag to upload your payment proof</p>
            <p className="text-xs text-slate-400">Image will be compressed automatically before upload</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary flex-1">
            Submit payment proof
          </button>
          <button type="button" className="btn btn-ghost" onClick={clearImage}>
            Clear
          </button>
        </div>
      )}
    </form>
  );
}

function compressImage(
  file: File,
  maxDim = 1000,
  quality = 0.65
): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ base64: dataUrl.split(",")[1], mime: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

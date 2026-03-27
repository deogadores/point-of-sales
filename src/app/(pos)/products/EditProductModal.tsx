"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { updateProductAction } from "@/app/(pos)/actions";

const ASPECT = 800 / 560;

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

type Unit = { id: number; name: string; symbol: string | null };
type Product = {
  id: number;
  name: string;
  image_url: string | null;
  unit_id: number;
  unit_cost_price: number;
  unit_sale_price: number;
};

export function EditProductModal({ product, units }: { product: Product; units: Unit[] }) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [preview, setPreview] = useState<string | null>(product.image_url);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPx, setCroppedAreaPx] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, px: Area) => {
    setCroppedAreaPx(px);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setUploadError("Only JPG and PNG files are allowed.");
      e.target.value = "";
      return;
    }
    setUploadError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleCropConfirm() {
    if (!cropSrc || !croppedAreaPx) return;
    setCropSrc(null);
    setUploading(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPx);
      setPreview(URL.createObjectURL(blob));
      const fd = new FormData();
      fd.append("file", new File([blob], "product.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/products/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) throw new Error(data.error || "Upload failed");
      setImageUrl(data.imageUrl);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
      setPreview(null);
      setImageUrl("");
    } finally {
      setUploading(false);
    }
  }

  function handleCropCancel() {
    setCropSrc(null);
  }

  function handleRemoveImage() {
    setPreview(null);
    setImageUrl("");
    setUploadError(null);
  }

  function handleClose() {
    setOpen(false);
    setCropSrc(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost px-3 py-1.5 text-xs"
      >
        Edit
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={handleClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="text-sm font-semibold dark:text-slate-100">
                  {cropSrc ? "Crop image" : "Edit Product"}
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {cropSrc ? (
                /* ── Crop view ── */
                <>
                  <div className="px-5 pb-2 text-xs text-slate-400">Pan to reposition · Pinch or scroll to zoom</div>
                  <div className="relative w-full" style={{ height: 300 }}>
                    <Cropper
                      image={cropSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={ASPECT}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      style={{ containerStyle: { background: "#0f172a" } }}
                    />
                  </div>
                  <div className="px-5 pt-3 pb-1 flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-4">–</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="text-xs text-slate-400 w-4">+</span>
                  </div>
                  <div className="flex gap-2 p-5">
                    <button type="button" onClick={handleCropConfirm} className="btn btn-primary flex-1">
                      Use this crop
                    </button>
                    <button type="button" onClick={handleCropCancel} className="btn btn-ghost flex-1">
                      Back
                    </button>
                  </div>
                </>
              ) : (
                /* ── Edit form view ── */
                <form action={updateProductAction} className="px-5 pb-5 space-y-3">
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="imageUrl" value={imageUrl} />

                  <label className="block">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Name</div>
                    <input name="name" defaultValue={product.name} className="field" required />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Unit cost</div>
                      <input name="unitCostPrice" type="number" step="0.01" min="0" defaultValue={product.unit_cost_price} className="field" required />
                    </label>
                    <label>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Sale price</div>
                      <input name="unitSalePrice" type="number" step="0.01" min="0" defaultValue={product.unit_sale_price} className="field" required />
                    </label>
                  </div>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Unit</div>
                    <select name="unitId" className="field" defaultValue={product.unit_id}>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.symbol ? `(${u.symbol})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Image (optional)</div>
                    <div className="mt-0.5 mb-1 text-xs text-slate-400">Landscape images work best (800×560px). Shown on the reserve page.</div>
                    <div className="mt-1 flex items-start gap-3">
                      {preview ? (
                        <div className="relative">
                          <img src={preview} alt="Preview" className="h-16 w-28 rounded-lg object-cover border border-slate-200" />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white text-xs leading-none"
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-16 w-28 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition">
                          <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={handleFileChange} />
                          {uploading ? (
                            <span className="text-[10px]">Uploading…</span>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          )}
                        </label>
                      )}
                      {uploadError && <p className="mt-1 text-xs text-rose-600">{uploadError}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="btn btn-primary flex-1" disabled={uploading}>
                      {uploading ? "Uploading..." : "Save changes"}
                    </button>
                    <button type="button" onClick={handleClose} className="btn btn-ghost flex-1">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

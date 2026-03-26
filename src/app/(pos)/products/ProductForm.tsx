"use client";

import { useRef, useState } from "react";
import { createProductAction } from "@/app/(pos)/actions";

type Unit = { id: number; name: string; symbol: string | null };

export function ProductForm({ units }: { units: Unit[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setUploadError("Only JPG and PNG files are allowed.");
      e.target.value = "";
      return;
    }

    setUploadError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
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

  function handleRemoveImage() {
    setPreview(null);
    setImageUrl("");
    setUploadError(null);
    if (formRef.current) {
      const input = formRef.current.querySelector<HTMLInputElement>('input[type="file"]');
      if (input) input.value = "";
    }
  }

  return (
    <form ref={formRef} action={createProductAction} className="mt-4 grid gap-2 sm:grid-cols-7">
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <label className="sm:col-span-2">
        <div className="text-xs font-medium text-slate-600">Name</div>
        <input name="name" placeholder="e.g. Coffee beans" className="field" required />
      </label>

      <label className="sm:col-span-2">
        <div className="text-xs font-medium text-slate-600">Unit</div>
        <select name="unitId" className="field" required defaultValue={units[0]?.id ?? ""}>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} {u.symbol ? `(${u.symbol})` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-1">
        <div className="text-xs font-medium text-slate-600">Unit cost</div>
        <input name="unitCostPrice" type="number" step="0.01" min="0" className="field" required />
      </label>

      <label className="sm:col-span-1">
        <div className="text-xs font-medium text-slate-600">Sale price</div>
        <input name="unitSalePrice" type="number" step="0.01" min="0" className="field" required />
      </label>

      <label className="sm:col-span-1">
        <div className="text-xs font-medium text-slate-600">Initial stock</div>
        <input name="initialStock" type="number" step="0.01" min="0" defaultValue="0" className="field" />
      </label>

      <div className="sm:col-span-7">
        <div className="text-xs font-medium text-slate-600">Image (optional)</div>
        <div className="mt-1 flex items-start gap-3">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="h-16 w-16 rounded-lg object-cover border border-slate-200"
              />
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
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition">
              <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={handleFileChange} />
              {uploading ? (
                <span className="text-[10px]">...</span>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </label>
          )}
          {uploadError && (
            <p className="mt-1 text-xs text-rose-600">{uploadError}</p>
          )}
        </div>
      </div>

      <div className="sm:col-span-7">
        <button className="btn btn-primary w-full sm:w-auto" disabled={uploading}>
          {uploading ? "Uploading..." : "Add product"}
        </button>
      </div>
    </form>
  );
}

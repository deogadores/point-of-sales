"use client";

import { useRef, useState } from "react";
import { updateProductAction } from "@/app/(pos)/actions";

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
  const formRef = useRef<HTMLFormElement>(null);
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [preview, setPreview] = useState<string | null>(product.image_url);
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
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold dark:text-slate-100">Edit Product</div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <form ref={formRef} action={updateProductAction} className="space-y-3">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="imageUrl" value={imageUrl} />

                <label className="block">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Name</div>
                  <input name="name" defaultValue={product.name} className="field" required />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Unit cost</div>
                    <input
                      name="unitCostPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={product.unit_cost_price}
                      className="field"
                      required
                    />
                  </label>
                  <label>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Sale price</div>
                    <input
                      name="unitSalePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={product.unit_sale_price}
                      className="field"
                      required
                    />
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
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                        {uploading ? (
                          <span className="text-[10px]">...</span>
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
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}

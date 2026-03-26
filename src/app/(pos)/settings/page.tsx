import { requireAuth } from "@/lib/auth";
import { updateSettingsAction } from "@/app/(pos)/actions";

export const runtime = "nodejs";

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "PHP", label: "PHP — Philippine Peso" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "MYR", label: "MYR — Malaysian Ringgit" },
  { code: "IDR", label: "IDR — Indonesian Rupiah" },
  { code: "THB", label: "THB — Thai Baht" },
  { code: "VND", label: "VND — Vietnamese Dong" },
  { code: "KRW", label: "KRW — South Korean Won" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "BRL", label: "BRL — Brazilian Real" },
  { code: "MXN", label: "MXN — Mexican Peso" },
  { code: "ZAR", label: "ZAR — South African Rand" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "SAR", label: "SAR — Saudi Riyal" },
];

export default async function SettingsPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm font-semibold">Settings</div>
        <p className="mt-1 text-xs text-slate-500">Store-scoped configuration for {user.storeName}.</p>
      </div>

      <form action={updateSettingsAction} className="space-y-4">
        <div className="card space-y-4">
          <div>
            <div className="text-sm font-semibold">Live notifications</div>
            <p className="mt-1 text-xs text-slate-500">
              When enabled, reservation events are pushed to all signed-in store members in real time via a persistent connection. Disable to turn off notifications entirely.
            </p>
          </div>
          <input type="hidden" name="liveNotifications" value="0" />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="liveNotifications"
              value="1"
              defaultChecked={user.liveNotifications}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <span className="text-sm">{user.liveNotifications ? "Enabled" : "Disabled"}</span>
          </label>
        </div>

        <div className="card space-y-4">
          <div>
            <div className="text-sm font-semibold">Currency</div>
            <p className="mt-1 text-xs text-slate-500">
              Used for all prices, profits, and charts across the store.
            </p>
          </div>
          <label className="block max-w-xs">
            <div className="text-xs font-medium text-slate-600">Currency</div>
            <select name="currency" defaultValue={user.storeCurrency} className="field mt-1">
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save settings</button>
        </div>
      </form>
    </div>
  );
}

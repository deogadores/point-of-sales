import { requireAuth } from "@/lib/auth";
import { updateSettingsAction } from "@/app/(pos)/actions";

export const runtime = "nodejs";

const TIMEZONES = [
  { value: "UTC", label: "UTC — Coordinated Universal Time" },
  { value: "America/New_York", label: "America/New_York — Eastern Time" },
  { value: "America/Chicago", label: "America/Chicago — Central Time" },
  { value: "America/Denver", label: "America/Denver — Mountain Time" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles — Pacific Time" },
  { value: "America/Anchorage", label: "America/Anchorage — Alaska Time" },
  { value: "Pacific/Honolulu", label: "Pacific/Honolulu — Hawaii Time" },
  { value: "America/Toronto", label: "America/Toronto — Eastern Time (Canada)" },
  { value: "America/Vancouver", label: "America/Vancouver — Pacific Time (Canada)" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo — Brasília Time" },
  { value: "America/Mexico_City", label: "America/Mexico_City — Central Time (Mexico)" },
  { value: "America/Bogota", label: "America/Bogota — Colombia Time" },
  { value: "America/Lima", label: "America/Lima — Peru Time" },
  { value: "America/Santiago", label: "America/Santiago — Chile Time" },
  { value: "America/Buenos_Aires", label: "America/Buenos_Aires — Argentina Time" },
  { value: "Europe/London", label: "Europe/London — GMT / BST" },
  { value: "Europe/Paris", label: "Europe/Paris — Central European Time" },
  { value: "Europe/Berlin", label: "Europe/Berlin — Central European Time" },
  { value: "Europe/Rome", label: "Europe/Rome — Central European Time" },
  { value: "Europe/Madrid", label: "Europe/Madrid — Central European Time" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam — Central European Time" },
  { value: "Europe/Stockholm", label: "Europe/Stockholm — Central European Time" },
  { value: "Europe/Moscow", label: "Europe/Moscow — Moscow Time" },
  { value: "Africa/Cairo", label: "Africa/Cairo — Eastern European Time" },
  { value: "Africa/Lagos", label: "Africa/Lagos — West Africa Time" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi — East Africa Time" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg — South Africa Time" },
  { value: "Asia/Dubai", label: "Asia/Dubai — Gulf Standard Time" },
  { value: "Asia/Karachi", label: "Asia/Karachi — Pakistan Time" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata — India Standard Time" },
  { value: "Asia/Dhaka", label: "Asia/Dhaka — Bangladesh Time" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok — Indochina Time" },
  { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala_Lumpur — Malaysia Time" },
  { value: "Asia/Singapore", label: "Asia/Singapore — Singapore Time" },
  { value: "Asia/Manila", label: "Asia/Manila — Philippine Time" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta — Western Indonesia Time" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai — China Standard Time" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong — Hong Kong Time" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo — Japan Standard Time" },
  { value: "Asia/Seoul", label: "Asia/Seoul — Korea Standard Time" },
  { value: "Australia/Perth", label: "Australia/Perth — AWST" },
  { value: "Australia/Sydney", label: "Australia/Sydney — AEST / AEDT" },
  { value: "Australia/Melbourne", label: "Australia/Melbourne — AEST / AEDT" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland — New Zealand Time" },
  { value: "Pacific/Fiji", label: "Pacific/Fiji — Fiji Time" },
];

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
  const isOwner = user.role === "Owner";

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm font-semibold">Settings</div>
        <p className="mt-1 text-xs text-slate-500">Store-scoped configuration for {user.storeName}.</p>
      </div>

      <form action={updateSettingsAction} className="space-y-4">
        {isOwner && (
          <div className="card space-y-4">
            <div>
              <div className="text-sm font-semibold">Store name</div>
              <p className="mt-1 text-xs text-slate-500">
                Changing the store name will also update the store URL slug.
              </p>
            </div>
            <label className="block max-w-xs">
              <div className="text-xs font-medium text-slate-600">Name</div>
              <input
                type="text"
                name="storeName"
                defaultValue={user.storeName}
                minLength={2}
                maxLength={80}
                required
                className="field mt-1"
              />
            </label>
          </div>
        )}

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

        <div className="card space-y-4">
          <div>
            <div className="text-sm font-semibold">Timezone</div>
            <p className="mt-1 text-xs text-slate-500">
              All dates and times will be displayed in this timezone.
            </p>
          </div>
          <label className="block max-w-xs">
            <div className="text-xs font-medium text-slate-600">Timezone</div>
            <select name="timezone" defaultValue={user.storeTimezone} className="field mt-1">
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </label>
        </div>

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

        {isOwner && (
          <div className="card space-y-4">
            <div>
              <div className="text-sm font-semibold">Payment QR / Share link</div>
              <p className="mt-1 text-xs text-slate-500">
                Shown to customers on the reservation page when waiting for payment. Paste a GCash QR link, payment portal URL, or any share link.
              </p>
            </div>
            <label className="block max-w-sm">
              <div className="text-xs font-medium text-slate-600">Link URL</div>
              <input
                type="url"
                name="paymentLink"
                defaultValue={user.storePaymentLink ?? ""}
                placeholder="https://..."
                className="field mt-1"
              />
            </label>
            {user.storePaymentLink && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current: <a href={user.storePaymentLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400 break-all">{user.storePaymentLink}</a>
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button className="btn btn-primary">Save settings</button>
        </div>
      </form>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Globe, Receipt, Shield, Layers } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SettingsPage() {
  const { store, refreshAppData } = useApp();
  const [settings, setSettings] = useState<Record<string, string>>({
    STORE_NAME: 'NexaMart Flagship Superstore',
    CURRENCY: 'AUD',
    CURRENCY_SYMBOL: '$',
    TAX_NAME: 'GST',
    TAX_RATE: '10.0',
    TAX_INCLUSIVE: 'true',
    RECEIPT_HEADER: 'NexaMart Flagship Superstore\n250 Elizabeth Street, Melbourne VIC\nPhone: +61 3 9876 5432\nABN: 88 123 456 789',
    RECEIPT_FOOTER: 'Thank you for shopping at NexaMart!\nPlease retain your receipt for refunds within 14 days.\nVisit us online at www.nexamart.com.au',
    LOW_STOCK_THRESHOLD: '10',
    ALLOW_NEGATIVE_STOCK: 'false',
    DEFAULT_PRINTER: '80mm',
  });

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings((prev) => ({ ...prev, ...d.settings }));
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleCountryPreset = (country: string) => {
    if (country === 'AU') {
      setSettings((prev) => ({
        ...prev,
        CURRENCY: 'AUD',
        CURRENCY_SYMBOL: '$',
        TAX_NAME: 'GST',
        TAX_RATE: '10.0',
        TAX_INCLUSIVE: 'true',
      }));
    } else if (country === 'US') {
      setSettings((prev) => ({
        ...prev,
        CURRENCY: 'USD',
        CURRENCY_SYMBOL: '$',
        TAX_NAME: 'Sales Tax',
        TAX_RATE: '8.25',
        TAX_INCLUSIVE: 'false',
      }));
    } else if (country === 'UK') {
      setSettings((prev) => ({
        ...prev,
        CURRENCY: 'GBP',
        CURRENCY_SYMBOL: '£',
        TAX_NAME: 'VAT',
        TAX_RATE: '20.0',
        TAX_INCLUSIVE: 'true',
      }));
    } else if (country === 'CA') {
      setSettings((prev) => ({
        ...prev,
        CURRENCY: 'CAD',
        CURRENCY_SYMBOL: '$',
        TAX_NAME: 'HST/GST',
        TAX_RATE: '13.0',
        TAX_INCLUSIVE: 'false',
      }));
    } else if (country === 'BD') {
      setSettings((prev) => ({
        ...prev,
        CURRENCY: 'BDT',
        CURRENCY_SYMBOL: '৳',
        TAX_NAME: 'VAT',
        TAX_RATE: '15.0',
        TAX_INCLUSIVE: 'true',
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
        await refreshAppData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Store & Tax Configurations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Country presets, GST/VAT tax pricing rules, and thermal receipt customization
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
        >
          {savedNotice ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : savedNotice ? 'Settings Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Country & Currency Presets */}
        <div className="p-6 bg-white  border border-slate-200  rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 ">
            <Globe className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 ">
              Country & Currency Localization Presets
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { code: 'AU', label: '🇦🇺 Australia (AUD $, 10% GST Inclusive)' },
              { code: 'US', label: '🇺🇸 United States (USD $, Sales Tax Exclusive)' },
              { code: 'UK', label: '🇬🇧 United Kingdom (GBP £, 20% VAT Inclusive)' },
              { code: 'CA', label: '🇨🇦 Canada (CAD $, GST/PST Exclusive)' },
              { code: 'BD', label: '🇧🇩 Bangladesh (BDT ৳, 15% VAT)' },
            ].map((c) => (
              <button
                type="button"
                key={c.code}
                onClick={() => handleCountryPreset(c.code)}
                className="px-3 py-1.5 rounded-xl border border-slate-200  bg-slate-50  text-xs font-semibold text-slate-700  hover:border-sky-500 hover:text-sky-600 transition-colors"
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700  mb-1">
                Currency Code
              </label>
              <input
                type="text"
                value={settings.CURRENCY}
                onChange={(e) => setSettings({ ...settings, CURRENCY: e.target.value })}
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700  mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={settings.CURRENCY_SYMBOL}
                onChange={(e) => setSettings({ ...settings, CURRENCY_SYMBOL: e.target.value })}
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700  mb-1">
                Tax Label (e.g. GST, VAT)
              </label>
              <input
                type="text"
                value={settings.TAX_NAME}
                onChange={(e) => setSettings({ ...settings, TAX_NAME: e.target.value })}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700  mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.TAX_RATE}
                onChange={(e) => setSettings({ ...settings, TAX_RATE: e.target.value })}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="taxInclusive"
              checked={settings.TAX_INCLUSIVE === 'true'}
              onChange={(e) =>
                setSettings({ ...settings, TAX_INCLUSIVE: String(e.target.checked) })
              }
              className="rounded text-sky-600"
            />
            <label htmlFor="taxInclusive" className="text-xs font-semibold text-slate-700 ">
              Tax-Inclusive Pricing (Common in Australia & UK: Shelf prices already include GST/VAT)
            </label>
          </div>
        </div>

        {/* Thermal Receipt Settings */}
        <div className="p-6 bg-white  border border-slate-200  rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 ">
            <Receipt className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 ">
              Thermal Receipt & Invoice Template
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700  mb-1">
              Store Legal Trading Name
            </label>
            <input
              type="text"
              value={settings.STORE_NAME}
              onChange={(e) => setSettings({ ...settings, STORE_NAME: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700  mb-1">
                Receipt Header Text (Address, Phone, Tax ID)
              </label>
              <textarea
                rows={4}
                value={settings.RECEIPT_HEADER}
                onChange={(e) => setSettings({ ...settings, RECEIPT_HEADER: e.target.value })}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300  bg-slate-50 "
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700  mb-1">
                Receipt Footer (Thank you note, Return policy)
              </label>
              <textarea
                rows={4}
                value={settings.RECEIPT_FOOTER}
                onChange={(e) => setSettings({ ...settings, RECEIPT_FOOTER: e.target.value })}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300  bg-slate-50 "
              />
            </div>
          </div>
        </div>

        {/* POS & Inventory Safety Rules */}
        <div className="p-6 bg-white  border border-slate-200  rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 ">
            <Shield className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 ">
              Inventory Safety & POS Safeguards
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700  mb-1">
                Low Stock Threshold (Triggers Alert)
              </label>
              <input
                type="number"
                value={settings.LOW_STOCK_THRESHOLD}
                onChange={(e) => setSettings({ ...settings, LOW_STOCK_THRESHOLD: e.target.value })}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700  mb-1">
                Default Thermal Printer Format
              </label>
              <select
                value={settings.DEFAULT_PRINTER}
                onChange={(e) => setSettings({ ...settings, DEFAULT_PRINTER: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
              >
                <option value="80mm">Standard 80mm ESC/POS Thermal</option>
                <option value="58mm">Compact 58mm Mobile Thermal</option>
                <option value="A4">A4 Full Sheet Commercial Invoice</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

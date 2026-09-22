'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Barcode as BarcodeIcon,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import BarcodeGenerator from '@/components/BarcodeGenerator';

export default function ProductsPage() {
  const { store, formatCurrency } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [barcodeLabelProduct, setBarcodeLabelProduct] = useState<any | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    categoryId: '',
    supplierId: '',
    sku: '',
    barcode: '',
    costPrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    taxRate: '10.0',
    unit: 'pcs',
    minStockLevel: '8',
    maxStockLevel: '100',
    reorderPoint: '15',
    shelfLocation: 'Aisle 1',
    initialStock: '20',
    isPerishable: false,
    hasBatchTracking: false,
  });

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (stockStatus !== 'all') params.set('stockStatus', stockStatus);
    if (store?.id) params.set('storeId', store.id);

    Promise.all([
      fetch(`/api/products?${params.toString()}`).then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/suppliers').then((r) => r.json()),
    ])
      .then(([prodData, catData, supData]) => {
        setProducts(prodData.products || []);
        setCategories(catData.categories || []);
        setSuppliers(supData.suppliers || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [query, selectedCategory, stockStatus, store?.id]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      shortName: '',
      description: '',
      categoryId: categories[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: `93${Math.floor(10000000000 + Math.random() * 90000000000)}`,
      costPrice: '2.50',
      sellingPrice: '4.50',
      wholesalePrice: '3.80',
      taxRate: '10.0',
      unit: 'pcs',
      minStockLevel: '8',
      maxStockLevel: '100',
      reorderPoint: '15',
      shelfLocation: 'Aisle 1',
      initialStock: '25',
      isPerishable: false,
      hasBatchTracking: false,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      shortName: p.shortName || '',
      description: p.description || '',
      categoryId: typeof p.category === 'object' ? p.category.id : p.categoryId,
      supplierId: p.supplierId || '',
      sku: p.sku,
      barcode: p.barcode,
      costPrice: String(p.costPrice),
      sellingPrice: String(p.sellingPrice),
      wholesalePrice: String(p.wholesalePrice || ''),
      taxRate: String(p.taxRate),
      unit: p.unit || 'pcs',
      minStockLevel: String(p.minStockLevel || 8),
      maxStockLevel: String(p.maxStockLevel || 100),
      reorderPoint: String(p.reorderPoint || 15),
      shelfLocation: p.shelfLocation || '',
      initialStock: '0',
      isPerishable: Boolean(p.isPerishable),
      hasBatchTracking: Boolean(p.hasBatchTracking),
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          storeId: store?.id,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCsv = () => {
    let csv = 'Name,SKU,Barcode,Category,Cost,Price,Stock,ReorderPoint\n';
    products.forEach((p) => {
      const cat = typeof p.category === 'object' ? p.category.name : p.category;
      csv += `"${p.name}","${p.sku}","${p.barcode}","${cat}",${p.costPrice},${p.sellingPrice},${p.stock},${p.reorderPoint}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleImportSubmit = async () => {
    if (!importCsvText) return;
    const lines = importCsvText.split('\n').filter((l) => l.trim().length > 0);
    let successCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.replace(/"/g, '').trim());
      if (parts.length >= 4) {
        const [name, sku, barcode, price] = parts;
        try {
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
              barcode: barcode || `93${Math.floor(10000000000 + Math.random() * 90000000000)}`,
              categoryId: categories[0]?.id,
              sellingPrice: parseFloat(price) || 5.0,
              costPrice: (parseFloat(price) || 5.0) * 0.6,
              initialStock: 20,
              storeId: store?.id,
            }),
          });
          successCount++;
        } catch (e) {}
      }
    }

    setImportStatus(`Successfully imported ${successCount} products!`);
    loadData();
    setTimeout(() => {
      setShowImportModal(false);
      setImportStatus(null);
      setImportCsvText('');
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Product Catalog & Barcodes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage supermarket SKUs, barcode labels, shelf locations, and retail margins ({products.length} items)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 rounded-xl border border-slate-200  bg-white  text-xs font-semibold text-slate-700  hover:bg-slate-50 flex items-center space-x-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl border border-slate-200  bg-white  text-xs font-semibold text-slate-700  hover:bg-slate-50 flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search product name, barcode, or SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200  bg-slate-50  text-slate-900  focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Category selector */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200  bg-slate-50  text-slate-800  font-medium"
        >
          <option value="all">All Departments</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Stock status filter */}
        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200  bg-slate-50  text-slate-800  font-medium"
        >
          <option value="all">All Stock Status</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock Only</option>
          <option value="out">Out of Stock Only</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-3">Barcode / SKU</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-right">Cost</th>
                <th className="py-3 px-3 text-right">Retail Price</th>
                <th className="py-3 px-3 text-center">Stock on Hand</th>
                <th className="py-3 px-3">Shelf</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading catalog items...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No products matching your search criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= p.reorderPoint;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50  transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 ">
                          {p.name}
                        </div>
                        {p.isPerishable && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800  ">
                            Perishable (FEFO)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 ">
                        <div>{p.barcode}</div>
                        <div className="text-[10px] text-slate-400">{p.sku}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 ">
                        {typeof p.category === 'object' ? p.category.name : p.category}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-500 font-mono">
                        {formatCurrency(p.costPrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-sky-600  font-mono">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700  '
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800  '
                              : 'bg-emerald-100 text-emerald-700  '
                          }`}
                        >
                          {p.stock} {p.unit || 'pcs'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {p.shelfLocation || 'Main Aisle'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setBarcodeLabelProduct(p)}
                            title="Print Barcode Label"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 "
                          >
                            <BarcodeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700  hover:bg-slate-100 "
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Archive Product"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 "
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Label Print Dialog */}
      {barcodeLabelProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 ">
                Print Barcode Label
              </h3>
              <button
                onClick={() => setBarcodeLabelProduct(null)}
                className="text-slate-400 p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50  rounded-2xl border border-slate-200  flex flex-col items-center">
              <p className="font-bold text-xs text-slate-900  line-clamp-1">
                {barcodeLabelProduct.name}
              </p>
              <p className="text-xs font-black text-sky-600  my-1">
                {formatCurrency(barcodeLabelProduct.sellingPrice)}
              </p>
              <BarcodeGenerator value={barcodeLabelProduct.barcode} width={200} height={55} />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setBarcodeLabelProduct(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200  flex justify-between items-center bg-slate-50 ">
              <h2 className="text-sm font-bold text-slate-900 ">
                {editingProduct ? 'Edit Product Parameters' : 'Add New Product to Catalog'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700  mb-1">
                    Product Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">
                    Department / Category *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">
                    Supplier
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  >
                    <option value="">None / Direct</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">
                    Barcode (EAN-13 / UPC)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">
                    Purchase Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">
                    Retail Selling Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full text-xs font-bold text-sky-600 px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700  mb-1">
                      Initial Physical Stock Count
                    </label>
                    <input
                      type="number"
                      value={formData.initialStock}
                      onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">
                    Reorder Point (Low Stock Alert)
                  </label>
                  <input
                    type="number"
                    value={formData.reorderPoint}
                    onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700  mb-1">
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    value={formData.shelfLocation}
                    onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                    placeholder="Aisle 2, Shelf B"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  />
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <input
                    type="checkbox"
                    id="isPerishable"
                    checked={formData.isPerishable}
                    onChange={(e) => setFormData({ ...formData, isPerishable: e.target.checked })}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="isPerishable" className="text-xs font-semibold text-slate-700 ">
                    Perishable Item (Enables Expiry & FEFO tracking)
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200  flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 ">
                Bulk CSV Product Import
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paste CSV rows in format: <code className="bg-slate-100  px-1 py-0.5 rounded font-mono">Name,SKU,Barcode,Price</code>
            </p>

            <textarea
              rows={8}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder={`Name,SKU,Barcode,Price\nOrganic Greek Yogurt 500g,DAI-OGY-500,9300123456789,4.50\nArtisan Rye Bread 600g,BAK-RYE-600,9300987654321,5.20`}
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300  bg-slate-50  text-slate-900 "
            />

            {importStatus && (
              <p className="text-xs font-bold text-emerald-600">{importStatus}</p>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
              >
                Validate & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

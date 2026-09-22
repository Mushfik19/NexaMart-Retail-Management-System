'use client';

import React, { useState, useEffect } from 'react';
import { Search, Barcode, Camera, Plus, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Props {
  onOpenScanner: () => void;
}

export default function ProductGrid({ onOpenScanner }: Props) {
  const { store, addToCart, formatCurrency } = useApp();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch((e) => console.error(e));
  }, []);

  // Fetch products based on category & query
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchQuery) params.set('q', searchQuery);
    if (store?.id) params.set('storeId', store.id);

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [selectedCategory, searchQuery, store?.id]);

  const handleAdd = (product: any) => {
    if (product.stock <= 0) return;
    addToCart(product, 1);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 800);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50  border-r border-slate-200 ">
      {/* Top Search & Barcode Scan Bar */}
      <div className="p-3 border-b border-slate-200  bg-white  flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="pos-search-input"
            type="text"
            placeholder="Search product, barcode, or SKU (F1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200  bg-slate-50  text-slate-900  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>
        <button
          onClick={onOpenScanner}
          title="Camera Barcode Scanner"
          className="p-2 rounded-xl border border-slate-200  bg-slate-50  text-slate-700  hover:bg-sky-50 hover:text-sky-600 transition-colors"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Category Horizontal Scrolling Tabs */}
      <div className="px-3 py-2 border-b border-slate-200  bg-white  flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100  text-slate-600  hover:bg-slate-200'
          }`}
        >
          All Departments
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100  text-slate-600  hover:bg-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 p-3 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200  animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            <Barcode className="w-10 h-10 stroke-1 mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 ">No products found</p>
            <p className="text-[11px] mt-0.5">Try searching with barcode or changing category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {products.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.stock > 0 && p.stock <= p.reorderPoint;
              const justAdded = justAddedId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => handleAdd(p)}
                  className={`group relative p-2.5 rounded-xl border transition-all flex flex-col justify-between select-none ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed bg-slate-100  border-slate-200 '
                      : justAdded
                      ? 'bg-emerald-50  border-emerald-500 shadow-md scale-95'
                      : 'cursor-pointer bg-white  border-slate-200  hover:border-sky-500 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Stock badge & Category */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 truncate max-w-[65%]">
                        {typeof p.category === 'object' ? p.category.name : p.category}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700  '
                            : isLowStock
                            ? 'bg-amber-100 text-amber-700  '
                            : 'bg-emerald-100 text-emerald-700  '
                        }`}
                      >
                        {isOutOfStock ? 'Out' : `${p.stock} in stock`}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-xs font-semibold text-slate-800  line-clamp-2 leading-snug">
                      {p.name}
                    </h3>
                  </div>

                  {/* Price & Add button */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100  flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-sky-600 ">
                        {formatCurrency(p.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">/{p.unit || 'pcs'}</span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        justAdded
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100  group-hover:bg-sky-600 group-hover:text-white text-slate-600 '
                      }`}
                    >
                      {justAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

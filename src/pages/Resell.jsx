import { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import { downloadProductsPDF, downloadProductsText } from '../utils/exportTools';
import SearchAndFilterBar from '../components/search/SearchAndFilterBar';
import { CurrencyContext } from '../context/CurrencyContext';
import { formatPrice, convertPrice, globalRates } from '../utils/currency';
import { FileText, FileDown, Loader2, ArrowUpDown, ChevronUp, ChevronDown, Youtube, Clock } from 'lucide-react';
import { useContext } from 'react';
import siteMeta from '../data/siteMeta.json';

export default function Resell() {
  const { products, loading } = useProducts();
  const { currency } = useContext(CurrencyContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [includePrice, setIncludePrice] = useState(true);
  const [resellerName, setResellerName] = useState('');
  const [resellerWhatsapp, setResellerWhatsapp] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [resellerPrices, setResellerPrices] = useState({});
  const [globalMarkup, setGlobalMarkup] = useState('');

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [sortOption, setSortOption] = useState('default');

  const handleGlobalMarkupChange = (e) => {
    const val = e.target.value;
    setGlobalMarkup(val);

    if (val === '') {
      setResellerPrices({});
      return;
    }

    const percent = Number(val);
    if (!isNaN(percent)) {
      const newPrices = { ...resellerPrices };
      products.forEach(p => {
        const ourPrice = convertPrice(p.our_price.amount, currency);
        let newPrice = ourPrice * (1 + percent / 100);
        
        if (currency === 'BDT') {
          const base = Math.floor(newPrice / 100) * 100;
          const remainder = newPrice % 100;
          if (remainder < 50) {
            newPrice = base + 50;
          } else {
            newPrice = base + 90;
          }
          newPrices[p.id] = newPrice.toFixed(0);
        } else {
          newPrices[p.id] = (currency === 'KRW') ? newPrice.toFixed(0) : newPrice.toFixed(2);
        }
      });
      setResellerPrices(newPrices);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (p.stock_status === 'out_of_stock') return false;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.plan.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = category === 'All' || p.category === category;
      return matchSearch && matchCategory;
    });

    if (sortOption && sortOption !== 'default') {
      result.sort((a, b) => {
        if (sortOption === 'price_asc') return parseFloat(a.our_price?.amount || 0) - parseFloat(b.our_price?.amount || 0);
        if (sortOption === 'price_desc') return parseFloat(b.our_price?.amount || 0) - parseFloat(a.our_price?.amount || 0);
        if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
        if (sortOption === 'name_desc') return b.name.localeCompare(a.name);
        return 0;
      });
    } else if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'our_price') {
          aVal = a.our_price?.amount || 0;
          bVal = b.our_price?.amount || 0;
        } else if (sortConfig.key === 'official_price') {
          aVal = a.official_price?.amount || 0;
          bVal = b.official_price?.amount || 0;
        } else if (sortConfig.key === 'saved_amount') {
          aVal = a.saved_amount?.amount || 0;
          bVal = b.saved_amount?.amount || 0;
        }

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [products, searchQuery, category, sortConfig, sortOption]);

  const getBaseAmount = (inputAmountStr, currentCurrency) => {
    const amount = Number(inputAmountStr) || 0;
    if (currentCurrency === 'USD') return amount * globalRates.USD;
    if (currentCurrency === 'EUR') return amount * globalRates.EUR;
    if (currentCurrency === 'GBP') return amount * globalRates.GBP;
    if (currentCurrency === 'KRW') return amount * globalRates.KRW;
    return amount; // BDT
  };

  const getCustomizedItems = () => {
    const itemsToExport = selectedItemIds.size === 0
      ? filteredProducts
      : filteredProducts.filter(p => selectedItemIds.has(p.id));

    return itemsToExport.map(p => {
      if (resellerPrices[p.id] && resellerPrices[p.id].trim() !== '') {
        const customBaseAmount = getBaseAmount(resellerPrices[p.id], currency);
        let newSavedAmount = p.saved_amount?.amount;
        if (p.official_price) {
          newSavedAmount = p.official_price.amount - customBaseAmount;
        }
        return {
          ...p,
          our_price: { ...p.our_price, amount: customBaseAmount },
          saved_amount: p.saved_amount ? { ...p.saved_amount, amount: newSavedAmount } : undefined
        };
      }
      return p;
    });
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const items = getCustomizedItems();
      await downloadProductsPDF(items, includePrice, currency, resellerName, resellerWhatsapp);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportText = () => {
    const items = getCustomizedItems();
    downloadProductsText(items, includePrice, currency, resellerName, resellerWhatsapp);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Reseller Hub</h1>
            <p className="text-slate-500">Export our product list to share with your customers.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100/60 rounded-full text-emerald-700 font-medium text-sm shadow-sm w-max">
            <Clock size={15} className="text-emerald-600" />
            <span>Product/Price Updated: <span className="font-bold tracking-wide">{siteMeta.lastUpdated}</span></span>
          </div>
        </div>
        <a
          href="https://youtube.com/watch?v=SoEMtjb3n0o&feature=youtu.be"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors text-sm border border-red-100 max-w-fit shadow-sm"
        >
          <Youtube size={16} className="text-red-500" />
          The Easiest Way to Use RESELL Option
        </a>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm premium-card mb-8">
        <SearchAndFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          category={category}
          setCategory={setCategory}
          categories={categories}
          sortOption={sortOption}
          setSortOption={setSortOption}
          showSort={true}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reseller Name (Optional)</label>
            <input
              type="text"
              value={resellerName}
              onChange={(e) => setResellerName(e.target.value)}
              placeholder="Your Brand Name"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number (Optional)</label>
            <input
              type="text"
              value={resellerWhatsapp}
              onChange={(e) => setResellerWhatsapp(e.target.value)}
              placeholder="+8801XXXXXXXXX"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Profit Percentage (%)</label>
            <input
              type="number"
              step="any"
              value={globalMarkup}
              onChange={handleGlobalMarkupChange}
              placeholder="e.g. 20"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-sm font-medium text-slate-700">Include Prices in export:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={includePrice}
                onChange={(e) => setIncludePrice(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportText}
              disabled={filteredProducts.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <FileText size={18} />
              <span>Text</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={filteredProducts.length === 0 || isExportingPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isExportingPDF ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
              <span>{isExportingPDF ? 'Generating...' : 'PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden premium-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 w-12 text-center select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      checked={filteredProducts.length > 0 && selectedItemIds.size === filteredProducts.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItemIds(new Set(filteredProducts.map(p => p.id)));
                        } else {
                          setSelectedItemIds(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-4 text-center select-none w-12">
                    <span className="font-semibold text-slate-500">S/N</span>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">Product
                      {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />) : <ArrowUpDown size={14} className="opacity-40 group-hover:opacity-100" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('plan')}>
                    <div className="flex items-center gap-2">Plan
                      {sortConfig.key === 'plan' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />) : <ArrowUpDown size={14} className="opacity-40 group-hover:opacity-100" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-2">Category
                      {sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />) : <ArrowUpDown size={14} className="opacity-40 group-hover:opacity-100" />}
                    </div>
                  </th>
                  {includePrice && (
                    <>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('official_price')}>
                        <div className="flex items-center justify-center gap-2">Official Price
                          {sortConfig.key === 'official_price' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />) : <ArrowUpDown size={14} className="opacity-40 group-hover:opacity-100" />}
                        </div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('our_price')}>
                        <div className="flex items-center justify-center gap-2">Our Price
                          {sortConfig.key === 'our_price' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />) : <ArrowUpDown size={14} className="opacity-40 group-hover:opacity-100" />}
                        </div>
                      </th>
                      <th className="px-6 py-4 select-none">
                        <div className="flex items-center justify-center">Reseller Price</div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('saved_amount')}>
                        <div className="flex items-center justify-center gap-2">Saved
                          {sortConfig.key === 'saved_amount' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />) : <ArrowUpDown size={14} className="opacity-40 group-hover:opacity-100" />}
                        </div>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        checked={selectedItemIds.has(product.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedItemIds);
                          if (e.target.checked) {
                            newSelected.add(product.id);
                          } else {
                            newSelected.delete(product.id);
                          }
                          setSelectedItemIds(newSelected);
                        }}
                      />
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-500 whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                        ) : (
                          <span className="font-bold text-slate-300">{product.name.charAt(0)}</span>
                        )}
                      </div>
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.plan}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {product.category}
                      </span>
                    </td>
                    {includePrice && (
                      <>
                        <td className="px-6 py-4 text-slate-400 text-center whitespace-nowrap line-through font-medium">
                          {(product.official_price && parseFloat(product.official_price.amount) > 0) ? formatPrice(product.official_price.amount, currency) : "-"}
                        </td>
                        <td className="px-6 py-4 font-bold text-brand-600 text-center whitespace-nowrap">
                          {formatPrice(product.our_price.amount, currency)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(() => {
                            const inputValStr = resellerPrices[product.id];
                            let isInvalid = false;
                            if (inputValStr && String(inputValStr).trim() !== '') {
                              const inputVal = Number(inputValStr);
                              const ourPriceConverted = convertPrice(product.our_price.amount, currency);
                              const officialPriceConverted = product.official_price ? convertPrice(product.official_price.amount, currency) : Infinity;
                              if (inputVal < ourPriceConverted || inputVal >= officialPriceConverted) {
                                isInvalid = true;
                              }
                            }
                            return (
                              <input
                                type="number"
                                value={inputValStr || ''}
                                onChange={(e) => setResellerPrices(prev => ({ ...prev, [product.id]: e.target.value }))}
                                placeholder="Custom"
                                className={`w-24 px-3 py-1.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 text-center font-medium ${isInvalid ? 'border-red-500 text-red-600 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'}`}
                              />
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-[#20bd5a] font-bold text-center whitespace-nowrap">
                          {(() => {
                            const hasOfficialPrice = product.official_price && parseFloat(product.official_price.amount) > 0;
                            if (!product.saved_amount || !hasOfficialPrice) return "-";
                            if (resellerPrices[product.id] && String(resellerPrices[product.id]).trim() !== '') {
                              const customBaseAmount = getBaseAmount(resellerPrices[product.id], currency);
                              if (product.official_price) {
                                const newSaved = product.official_price.amount - customBaseAmount;
                                return formatPrice(newSaved, currency);
                              }
                            }
                            return formatPrice(product.saved_amount.amount, currency);
                          })()}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={includePrice ? 8 : 4} className="px-6 py-12 text-center text-slate-500">
                      No products found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/ui/ProductGrid';
import ProductCard from '../components/ui/ProductCard';
import SearchAndFilterBar from '../components/search/SearchAndFilterBar';
import FilterChips from '../components/search/FilterChips';
import siteMeta from '../data/siteMeta.json';
import homeSections from '../data/homeSections.json';
import { Sparkles, Loader2, Clock, ChevronRight } from 'lucide-react';

export default function Home() {
  const { products, loading, error } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (p.visible === false) return false;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.plan.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = category === 'All' || p.category === category;
      return matchSearch && matchCategory;
    });

    if (sortOption === 'default') {
      const getStatusPriority = (status) => {
        if (!status) return 4;
        const s = status.toLowerCase();
        if (s.includes('popular')) return 1;
        if (s.includes('trending')) return 2;
        if (s.includes('new')) return 3;
        return 4;
      };
      result.sort((a, b) => {
        return getStatusPriority(a.status) - getStatusPriority(b.status);
      });
    } else if (sortOption === 'price_asc') {
      result.sort((a, b) => a.our_price.amount - b.our_price.amount);
    } else if (sortOption === 'price_desc') {
      result.sort((a, b) => b.our_price.amount - a.our_price.amount);
    } else if (sortOption === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    // Always push out of stock products to the bottom
    result.sort((a, b) => {
      const aStock = a.stock_status === 'out_of_stock';
      const bStock = b.stock_status === 'out_of_stock';
      if (aStock && !bStock) return 1;
      if (!aStock && bStock) return -1;
      return 0;
    });

    return result;
  }, [products, searchQuery, category, sortOption]);

  if (error) {
    return <div className="p-8 text-center text-red-500 mt-20">Error loading products: {error}</div>;
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-50 to-slate-50 pt-16 pb-12 px-4 border-b border-brand-100/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-brand-100 rounded-full text-brand-600 font-medium text-sm shadow-sm">
              <Sparkles size={16} /> Premium Digital Subscriptions
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100/60 rounded-full text-emerald-700 font-medium text-sm shadow-sm">
              <Clock size={15} className="text-emerald-600" />
              <span>Product/Price Updated: <span className="font-bold tracking-wide">{siteMeta.lastUpdated}</span></span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
            Cut the Cost, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Keep the Premium</span>
          </h1>
          <div className="max-w-2xl mx-auto mt-6 flex flex-col items-center gap-5">
            <p className="text-slate-500 text-lg leading-relaxed">
              We are here to stay and we guarantee a 100% satisfactory after-sales experience you can trust. If any issue occurs, our policy is simple:
            </p>
            <div className="flex flex-col items-center gap-3 w-full justify-center">
              <div className="inline-flex items-center justify-center text-brand-700 font-bold bg-brand-50/80 border border-brand-100 px-8 py-2.5 rounded-full shadow-sm text-lg">
                Fix, Replace or Refund
              </div>
              <div className="inline-flex items-center justify-center text-rose-600 font-medium bg-rose-50 border border-rose-100 px-4 py-1.5 rounded-full text-sm">
                <span className="mr-1.5">🚫</span> We strictly do NOT sell Shared Accounts
              </div>
            </div>
            <p className="text-slate-500 text-base leading-relaxed">
              Some products are delivered instantly, while others may take a few hours. Browse our plans below and grab these premium offers before they're gone!
            </p>
          </div>

          <div className="mt-8 pt-8 max-w-4xl mx-auto flex flex-col gap-3 items-center">
            <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">
              Countrywise (Happy Customers)
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mt-1">
              {['us', 'bd', 'kr', 'jp', 'th', 'fi', 'au', 'my', 'at', 'ie'].map((country, idx, arr) => (
                <div key={country} className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={`https://flagcdn.com/w80/${country}.png`}
                    alt={country.toUpperCase()}
                    title={country.toUpperCase()}
                    className="w-7 sm:w-8 h-auto drop-shadow-sm rounded-[3px] select-none"
                  />
                  {idx < arr.length - 1 && <span className="text-slate-300 font-light text-xl">|</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <SearchAndFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          category={category}
          setCategory={setCategory}
          categories={categories}
          sortOption={sortOption}
          setSortOption={setSortOption}
        />

        {categories.length > 0 && (
          <FilterChips
            categories={categories}
            activeCategory={category}
            onSelect={setCategory}
          />
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-500 gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="font-medium text-slate-500">Loading products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            {searchQuery === '' && category === 'All' && sortOption === 'default' ? (
              <div className="space-y-12">
                {homeSections.map((section) => {
                  const sectionProducts = filteredProducts.filter(p => p.category === section.category && p.stock_status !== 'out_of_stock');
                  if (sectionProducts.length === 0) return null;
                  
                  const displayProducts = section.limit ? sectionProducts.slice(0, section.limit) : sectionProducts;
                  
                  return (
                    <div key={section.id}>
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{section.title}</h2>
                        <button 
                          onClick={() => setCategory(section.category)}
                          className="text-brand-600 font-semibold text-sm hover:text-brand-700 flex items-center gap-1 transition-colors bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full"
                        >
                          View All <ChevronRight size={16} />
                        </button>
                      </div>
                      <ProductGrid>
                        {displayProducts.map(product => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </ProductGrid>
                    </div>
                  );
                })}

                <div className="pt-8 mt-12 border-t border-slate-200">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-5">More Products</h2>
                  <ProductGrid>
                    {filteredProducts
                      .filter(p => !homeSections.some(s => s.category === p.category) && p.stock_status !== 'out_of_stock')
                      .map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                  </ProductGrid>
                </div>

                {filteredProducts.some(p => p.stock_status === 'out_of_stock') && (
                  <div className="pt-8 mt-12 border-t border-slate-200 opacity-80">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-500 tracking-tight mb-5 flex items-center gap-2">
                      Currently Out of Stock
                    </h2>
                    <ProductGrid>
                      {filteredProducts
                        .filter(p => p.stock_status === 'out_of_stock')
                        .map(product => (
                          <ProductCard key={product.id} product={product} />
                      ))}
                    </ProductGrid>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-12">
                {filteredProducts.some(p => p.stock_status !== 'out_of_stock') && (
                  <ProductGrid>
                    {filteredProducts
                      .filter(p => p.stock_status !== 'out_of_stock')
                      .map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                  </ProductGrid>
                )}

                {filteredProducts.some(p => p.stock_status === 'out_of_stock') && (
                  <div className="pt-8 border-t border-slate-200 opacity-80">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-500 tracking-tight mb-5 flex items-center gap-2">
                      Currently Out of Stock
                    </h2>
                    <ProductGrid>
                      {filteredProducts
                        .filter(p => p.stock_status === 'out_of_stock')
                        .map(product => (
                          <ProductCard key={product.id} product={product} />
                      ))}
                    </ProductGrid>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <h3 className="text-xl font-bold text-slate-700 mb-2">No products found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
            <button
              onClick={() => { setSearchQuery(''); setCategory('All'); }}
              className="mt-4 px-6 py-2 bg-brand-50 text-brand-600 rounded-full font-medium hover:bg-brand-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

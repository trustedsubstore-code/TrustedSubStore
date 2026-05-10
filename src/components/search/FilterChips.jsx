export default function FilterChips({ categories, activeCategory, onSelect }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 pb-6 mb-2">
      <button
        onClick={() => onSelect('All')}
        className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
          activeCategory === 'All' 
            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 ring-1 ring-brand-600' 
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
        }`}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(activeCategory === cat ? 'All' : cat)}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
            activeCategory === cat 
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 ring-1 ring-brand-600' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

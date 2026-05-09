import { useState, useContext } from 'react';
import { Share2, ShoppingCart, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { CartContext } from '../../context/CartContext';
import { CurrencyContext } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/currency';

export default function ProductCard({ product }) {
  const [showModal, setShowModal] = useState(false);
  const { addToCart } = useContext(CartContext);
  const { currency } = useContext(CurrencyContext);

  const isOutOfStock = product.stock_status === 'out_of_stock';

  const getBadgeColor = (badgeText) => {
    if (!badgeText) return 'bg-brand-500 text-white';

    const text = badgeText.toLowerCase();
    if (text.includes('popular')) return 'bg-brand-500 text-white shadow-brand-500/30';
    if (text.includes('trending')) return 'bg-orange-500 text-white shadow-orange-500/30';
    if (text.includes('new')) return 'bg-blue-500 text-white shadow-blue-500/30';
    if (text.includes('premium') || text.includes('pro')) return 'bg-amber-400 text-amber-950 shadow-amber-400/30';

    // Default fallback
    return 'bg-slate-800 text-white shadow-slate-800/30';
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Buy ${product.name}`,
          text: `Check out ${product.name} at a great price!`,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  return (
    <div className={cn(
      "relative flex flex-col premium-card overflow-hidden group bg-white",
      isOutOfStock && "opacity-80"
    )}>
      {/* Category Badge (Left) */}
      {product.category && (
        <span className="absolute top-3 left-3 bg-slate-800 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider z-10 shadow-sm">
          {product.category}
        </span>
      )}

      {/* Status Badge (Right) */}
      {product.status && !isOutOfStock && (
        <span className={cn(
          "absolute top-3 right-3 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider z-10 shadow-sm",
          getBadgeColor(product.status)
        )}>
          {product.status}
        </span>
      )}

      {/* Out of Stock (Right) - overrides normal badge */}
      {isOutOfStock && (
        <span className="absolute top-3 right-3 bg-red-100 text-red-700 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full z-10 shadow-sm">
          Out of Stock
        </span>
      )}

      {/* Image */}
      <div className="relative aspect-video w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="object-contain w-full h-full px-6 pb-6 pt-12 group-hover:scale-[1.08] transition-transform duration-500 will-change-transform drop-shadow-sm"
            loading="lazy"
          />
        ) : (
          <span className="text-slate-400 font-medium text-4xl">{product.name.charAt(0)}</span>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-semibold text-lg leading-tight text-slate-900 line-clamp-2">{product.name}</h3>
          <button onClick={handleShare} className="text-slate-400 hover:text-brand-500 transition-colors p-1 -mr-1 flex-shrink-0" aria-label="Share">
            <Share2 size={16} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">{product.plan}</p>

        <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-4 mt-auto whitespace-nowrap w-full overflow-hidden">
          <div className="flex items-baseline gap-1.5 sm:gap-2 overflow-hidden truncate">
            <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {formatPrice(product.our_price.amount, currency)}
            </span>
            {product.official_price && parseFloat(product.official_price.amount) > 0 && (
              <span className="text-xs sm:text-sm text-slate-400 line-through">
                {formatPrice(product.official_price.amount, currency)}
              </span>
            )}
          </div>
          {product.saved_amount && parseFloat(product.official_price?.amount || 0) > 0 && (
            <span className="flex-shrink-0 text-[10px] sm:text-xs font-bold text-[#20bd5a] bg-[#25D366]/10 px-1.5 sm:px-2 py-1 rounded-md border border-[#25D366]/20">
              Save {formatPrice(product.saved_amount.amount, currency)}
            </span>
          )}
        </div>

        <div className="flex gap-2 mb-3">
          <button
            disabled={isOutOfStock}
            onClick={() => addToCart(product)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 rounded-xl font-medium transition-all active:scale-[0.98]",
              isOutOfStock
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-brand-600 hover:bg-brand-700 text-white shadow-md hover:shadow-lg hover:shadow-brand-500/20"
            )}
          >
            <ShoppingCart size={18} />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>

        <button
          disabled={isOutOfStock}
          onClick={() => setShowModal(true)}
          className={cn(
            "flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium rounded-lg transition-colors border",
            isOutOfStock 
              ? "text-slate-400 bg-slate-100 border-transparent cursor-not-allowed" 
              : "text-slate-600 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 border-transparent hover:border-brand-100"
          )}
        >
          View Details <Info size={16} />
        </button>

      </div>

      {/* Product Details Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl md:rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-10">
              <h2 className="text-xl font-bold text-slate-900">Product Details</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
              {/* Image Section */}
              <div className="w-full sm:w-1/3 aspect-square bg-slate-50 rounded-2xl flex items-center justify-center p-4 flex-shrink-0 border border-slate-100">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="object-contain w-full h-full drop-shadow-sm" />
                ) : (
                  <span className="text-slate-400 font-medium text-4xl">{product.name.charAt(0)}</span>
                )}
              </div>

              {/* Info Section */}
              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-xl text-slate-900 leading-tight">{product.name}</h3>
                    {product.status && !isOutOfStock && (
                      <span className={cn("text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", getBadgeColor(product.status))}>
                        {product.status}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium">{product.plan}</p>
                </div>

                <div className="flex items-end gap-2 mb-6">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {formatPrice(product.our_price.amount, currency)}
                  </span>
                  {product.official_price && parseFloat(product.official_price.amount) > 0 && (
                    <span className="text-sm text-slate-400 line-through mb-1">
                      {formatPrice(product.official_price.amount, currency)}
                    </span>
                  )}
                  {product.saved_amount && parseFloat(product.official_price?.amount || 0) > 0 && (
                    <span className="ml-auto text-xs font-bold text-[#20bd5a] bg-[#25D366]/10 px-2.5 py-1 rounded-md border border-[#25D366]/20 mb-1">
                      Save {formatPrice(product.saved_amount.amount, currency)}
                    </span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="space-y-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Duration</span>
                    <span className="text-slate-700 font-medium">{product.official_price?.duration || "Lifetime"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">How to get it</span>
                    <span className="text-slate-700 leading-relaxed whitespace-pre-wrap">{product.how_to_get}</span>
                  </div>
                  {product.remarks && (
                    <div className="pt-3 border-t border-slate-200/60">
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Remarks</span>
                      <span className="text-slate-700 leading-relaxed italic whitespace-pre-wrap">{product.remarks}</span>
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    disabled={isOutOfStock}
                    onClick={() => {
                      addToCart(product);
                      setShowModal(false);
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all active:scale-[0.98]",
                      isOutOfStock
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-brand-600 hover:bg-brand-700 text-white shadow-md hover:shadow-brand-500/20"
                    )}
                  >
                    <ShoppingCart size={18} />
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

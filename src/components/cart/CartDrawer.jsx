import { useContext } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { CurrencyContext } from '../../context/CurrencyContext';
import { cn } from '../../utils/cn';
import { generateWhatsAppLink, generateTelegramLink } from '../../utils/checkout';
import { formatPrice, convertPrice } from '../../utils/currency';

export default function CartDrawer({ isOpen, onClose }) {
  const { items, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const { currency } = useContext(CurrencyContext);
  
  const totalAmount = items.reduce((sum, item) => sum + convertPrice(item.our_price.amount * item.quantity, currency), 0);
  const totalSaved = items.reduce((sum, item) => sum + convertPrice((item.saved_amount?.amount || 0) * item.quantity, currency), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white shadow-2xl z-[101] flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-brand-600" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
            <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <ShoppingCart size={48} className="opacity-20" />
              <p>Your cart is empty</p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-100 text-slate-600 rounded-full font-medium hover:bg-slate-200 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl relative group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg border border-slate-200 flex-shrink-0 p-1 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="object-cover w-full h-full rounded" />
                    ) : (
                      <span className="font-bold text-slate-300">{item.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="pr-4">
                      <h4 className="font-semibold text-sm sm:text-base text-slate-900 leading-tight line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.plan}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-brand-600 text-sm sm:text-base">
                        {formatPrice(item.our_price.amount * item.quantity, currency)}
                      </span>
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-200 text-red-500 hover:text-white hover:bg-red-500 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="text-xl font-bold text-slate-900 mb-0">
                {currency === 'USD' ? 'USD ' : 'BDT '}
                {totalAmount.toFixed(currency === 'USD' ? 2 : 0)}
              </span>
            </div>
            {totalSaved > 0 && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-green-600 text-sm font-medium">Total Saved</span>
                <span className="text-green-600 text-sm font-bold bg-green-100 px-2 py-0.5 rounded">
                  {currency === 'USD' ? 'USD ' : 'BDT '}
                  {totalSaved.toFixed(currency === 'USD' ? 2 : 0)}
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <a 
                href={generateWhatsAppLink(items, totalAmount, currency)}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-medium transition-colors shadow-sm text-sm"
              >
                WhatsApp Order
              </a>
              <a 
                href={generateTelegramLink(items, totalAmount, currency)}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-[#0088cc] hover:bg-[#007ab8] text-white rounded-xl font-medium transition-colors shadow-sm text-sm"
              >
                Telegram Order
              </a>
            </div>
            <button 
              onClick={clearCart}
              className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-red-500 transition-colors font-medium"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}

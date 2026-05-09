import { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { CurrencyContext } from '../../context/CurrencyContext';
import CartDrawer from '../cart/CartDrawer';
import { cn } from '../../utils/cn';

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { items } = useContext(CartContext);
  const { currency, setCurrency } = useContext(CurrencyContext);
  const location = useLocation();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="fixed top-0 w-full h-16 glass z-40 flex items-center px-4 md:px-8 justify-between">
        <Link to="/" className="text-xl font-bold text-brand-600 tracking-tight flex items-center gap-2 flex-shrink-0 z-10">
          <img src="/logo.png" alt="TSS Logo" className="h-8 object-contain" />
          <span className="hidden sm:block whitespace-nowrap">Trusted Sub Store</span>
        </Link>
        <nav className="hidden md:flex gap-5 lg:gap-8 items-center flex-1 justify-center px-2">
          <Link to="/" className={cn("font-medium transition-colors hover:text-brand-600", isActive('/') ? "text-brand-600" : "text-slate-600")}>Products</Link>
          <Link to="/how-it-works" className={cn("font-medium transition-colors hover:text-brand-600", isActive('/how-it-works') ? "text-brand-600" : "text-slate-600")}>How it Works</Link>
          <Link to="/contact" className={cn("font-medium transition-colors hover:text-brand-600", isActive('/contact') ? "text-brand-600" : "text-slate-600")}>Contact</Link>
          <Link to="/resell" className={cn("font-medium transition-colors hover:text-brand-600", isActive('/resell') ? "text-brand-600" : "text-slate-600")}>Resell</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 z-10">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 pl-3 pr-2 py-1.5 rounded-full transition-colors shadow-sm border border-slate-200/50 cursor-pointer focus:outline-none appearance-none"
            title="Select Currency"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem top 50%',
              backgroundSize: '0.4rem auto',
              paddingRight: '1.2rem'
            }}
          >
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
            <option value="KRW">₩ KRW</option>
            <option value="BDT">৳ BDT</option>
          </select>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-slate-600 hover:text-brand-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all active:scale-95"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 bg-brand-600 hover:bg-brand-700 text-white rounded-full h-12 px-4 md:h-14 md:px-5 shadow-xl hover:shadow-brand-500/30 transition-all flex items-center gap-1.5 md:gap-2 active:scale-95"
          aria-label="Open Cart"
        >
          <div className="relative flex items-center">
            <ShoppingCart className="w-5 h-5 md:w-[22px] md:h-[22px]" />
            <span className="absolute -top-2.5 -left-1.5 md:-top-3 md:-left-2 bg-red-500 text-white text-[10px] md:text-[11px] font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full border border-brand-600 md:border-2">
              {totalItems}
            </span>
          </div>
          <span className="font-bold text-xs md:text-sm md:ml-1 md:pr-1">Order Now</span>
        </button>
      )}
    </>
  );
}

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Resell from './pages/Resell';
import Contact from './pages/Contact';
import Status from './pages/Status';
import Admin from './pages/Admin';
import Navbar from './components/layout/Navbar';
import BottomMobileNav from './components/layout/BottomMobileNav';
import ScrollToTop from './components/layout/ScrollToTop';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { WHATSAPP_NUMBER, TELEGRAM_HANDLE } from './utils/checkout';
import { MessageCircle, Send } from 'lucide-react';

function App() {
  return (
    <CurrencyProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar />
            <main className="flex-1 pb-20 md:pb-0 pt-16 flex flex-col">
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/resell" element={<Resell />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/how-it-works" element={<Status />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<div className="flex flex-col items-center justify-center py-20"><h2 className="text-2xl font-bold text-slate-800 mb-2">404 - Page Not Found</h2><p className="text-slate-500 mb-6">The page you are looking for doesn't exist.</p><a href="/" className="bg-brand-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-brand-700 transition-colors">Go Home</a></div>} />
                </Routes>
              </div>
              
              <footer className="w-full py-8 mt-12 text-center border-t border-slate-200 bg-slate-50 rounded-t-3xl">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <a 
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Mr. Mahmud\nI need some help.")}`}
                    target="_blank" rel="noreferrer"
                    className="p-2.5 bg-white rounded-full text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-[#25D366]/50"
                    title="WhatsApp"
                  >
                    <MessageCircle size={20} />
                  </a>
                  <a 
                    href={`https://t.me/${TELEGRAM_HANDLE}?text=${encodeURIComponent("Hello Mr. Mahmud\nI need some help.")}`}
                    target="_blank" rel="noreferrer"
                    className="p-2.5 bg-white rounded-full text-[#0088cc] hover:bg-[#0088cc] hover:text-white transition-colors border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-[#0088cc]/50"
                    title="Telegram"
                  >
                    <Send size={20} />
                  </a>
                </div>

                <div className="max-w-lg mx-auto px-4 mb-6">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    <span className="font-bold text-slate-800">Honest Warranty:</span> Guaranteed for as long as I am alive.<br />
                    <span className="font-bold text-brand-600 inline-block mt-0.5">(Fix, Replace or Refund)</span>
                  </p>
                </div>

                <p className="text-slate-500 text-sm font-medium">
                  &copy; {new Date().getFullYear()} Trusted Sub Store. All rights reserved.
                </p>
                <p className="text-slate-400 text-xs mt-1.5 flex items-center justify-center gap-1 cursor-default group">
                  Owned & Developed with 
                  <span className="inline-block animate-pulse text-rose-500 mx-0.5">❤</span> 
                  by <span className="font-medium group-hover:text-brand-600 transition-colors duration-300">Mahmud</span>
                </p>
              </footer>
            </main>
            <BottomMobileNav />
          </div>
        </Router>
      </CartProvider>
    </CurrencyProvider>
  );
}

export default App;

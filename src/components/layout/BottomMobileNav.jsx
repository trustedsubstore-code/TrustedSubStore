import { NavLink } from 'react-router-dom';
import { Home, List, Info, Phone } from 'lucide-react';

export default function BottomMobileNav() {
  const getLinkClasses = ({ isActive }) => 
    `flex flex-col items-center p-2 transition-colors duration-200 ${isActive ? 'text-brand-600 font-semibold' : 'text-slate-500 hover:text-brand-600'}`;

  return (
    <nav className="fixed bottom-0 w-full h-16 glass md:hidden z-50 flex items-center justify-around border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] bg-white">
      <NavLink to="/" className={getLinkClasses}>
        <Home size={20} />
        <span className="text-[10px] mt-1">Home</span>
      </NavLink>
      <NavLink to="/how-it-works" className={getLinkClasses}>
        <Info size={20} />
        <span className="text-[10px] mt-1">Info</span>
      </NavLink>
      <NavLink to="/contact" className={getLinkClasses}>
        <Phone size={20} />
        <span className="text-[10px] mt-1">Contact</span>
      </NavLink>
      <NavLink to="/resell" className={getLinkClasses}>
        <List size={20} />
        <span className="text-[10px] mt-1">Resell</span>
      </NavLink>
    </nav>
  );
}

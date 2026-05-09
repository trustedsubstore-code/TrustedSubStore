import { PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrackOrder() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 md:py-24 w-full text-center min-h-[80vh] flex flex-col items-center justify-center">
      <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-8 mx-auto shadow-sm">
        <PackageSearch size={48} />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
        Track Your Order
      </h1>
      
      <p className="text-slate-600 text-lg mb-8 leading-relaxed">
        We process all orders manually via our secure chat channels to ensure the fastest delivery and complete support for your purchased plans.
      </p>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm w-full premium-card text-left">
        <h3 className="font-bold text-xl text-slate-900 mb-6">How to check your status:</h3>
        <ul className="space-y-5 mb-8">
          <li className="flex gap-4 items-start text-slate-600">
            <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-sm">1</span>
            <div>
              <strong className="block text-slate-900 mb-0.5">Prepare details</strong>
              Have your payment confirmation and product name ready.
            </div>
          </li>
          <li className="flex gap-4 items-start text-slate-600">
            <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-sm">2</span>
            <div>
              <strong className="block text-slate-900 mb-0.5">Contact the team</strong>
              Message the admin who handled your order.
            </div>
          </li>
          <li className="flex gap-4 items-start text-slate-600">
            <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 shadow-sm">3</span>
            <div>
              <strong className="block text-slate-900 mb-0.5">Get status</strong>
              They will provide your credentials immediately if ready.
            </div>
          </li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
          <Link 
            to="/contact"
            className="flex-1 text-center py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            Contact Support Team
          </Link>
        </div>
      </div>
    </div>
  );
}

import { PackageSearch, ShieldCheck, Mail, Clock, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Status() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 w-full text-center min-h-[80vh] flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-sm">
        <PackageSearch size={40} />
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
        How Trusted Sub Store Works
      </h1>

      <p className="text-slate-600 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
        We prioritize trust, security, and a premium customer experience above all else. Here is everything you need to know about our honest delivery process, legitimate account handling, and reliable warranty policies.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8 text-left">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm premium-card transition-all hover:-translate-y-1">
          <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-5">
            <Clock size={28} />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-3">Delivery Process</h3>
          <p className="text-slate-600 leading-relaxed text-sm xl:text-base text-justify">
            To ensure the highest quality of service and security, our team provides a customized delivery experience. We will proactively reach out to you on your preferred platform (WhatsApp or Telegram) to securely hand over your premium digital goods.
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm premium-card transition-all hover:-translate-y-1">
          <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-5">
            <Mail size={28} />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-3">Account Handling</h3>
          <div className="space-y-3">
            <p className="text-slate-600 leading-relaxed text-sm xl:text-base text-justify">
              Depending on your specific purchase, we may require your email to send an official invite link or provide you with ready-to-use login credentials.
            </p>
            <p className="text-slate-600 leading-relaxed text-sm xl:text-base text-justify">
              Please note that some services will require the login details of your specific account to activate the subscription.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm premium-card transition-all hover:-translate-y-1 relative overflow-hidden">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-5">
            <UserCheck size={28} />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-3">100% Legitimacy</h3>
          <div className="space-y-3">
            <p className="text-slate-600 leading-relaxed text-sm xl:text-base text-justify">
              We guarantee that we <strong>do not sell shared accounts</strong>. Furthermore, there are absolutely <strong>no stolen accounts</strong>. Every product is completely legitimate and private to you.
            </p>
            <p className="text-slate-600 leading-relaxed text-sm xl:text-base text-justify">
              We also guarantee a fully satisfactory after-sales service.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-10 rounded-3xl shadow-lg w-full text-left relative overflow-hidden mb-10">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck size={160} className="text-white" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-brand-400 backdrop-blur-sm border border-white/10 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <div className="flex-1 w-full relative z-10">
            <h3 className="font-bold text-2xl text-white mb-3">Honest Warranty Policy</h3>
            <p className="text-slate-300 leading-relaxed text-lg">
              We believe in complete transparency. Our active support and product warranties will realistically be honored and guaranteed <strong>for as long as I am alive on this earth.</strong> We are fully committed to serving you with absolute integrity.
            </p>

            <div className="mt-6 bg-white/5 rounded-2xl p-5 border border-white/10 text-left backdrop-blur-sm shadow-sm">
              <h4 className="font-medium text-slate-200 mb-3 flex items-center gap-2">
                If any issue occurs, we guarantee to:
              </h4>
              <ul className="text-white font-medium space-y-3 md:flex md:space-y-0 md:gap-8">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]"></span>
                  Fix
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]"></span>
                  Replace <span className="text-slate-400 font-normal text-sm ml-1">(same OR other product)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]"></span>
                  Refund
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Link
        to="/contact"
        className="inline-flex items-center justify-center px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:shadow-brand-500/20 active:scale-95"
      >
        Contact Support Team
      </Link>
    </div>
  );
}

import { WHATSAPP_NUMBER, TELEGRAM_HANDLE } from '../utils/checkout';
import { MessageCircle, Send, Mail } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 w-full min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Need Help? Let's Talk!
        </h1>
        <p className="text-slate-500 text-lg max-w-lg mx-auto">
          Our support team is always ready to assist you. Choose your preferred platform below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <a 
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Mr. Mahmud\nI need some help.")}`}
          target="_blank" rel="noreferrer"
          className="flex flex-col items-center justify-center gap-4 p-8 bg-white border border-slate-200 rounded-3xl premium-card group"
        >
          <div className="w-16 h-16 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-[#25D366] group-hover:text-white transition-all duration-300">
            <MessageCircle size={32} />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-900">WhatsApp Support</h3>
            <p className="text-slate-500 text-sm mt-1">Fastest response times</p>
          </div>
        </a>

        <a 
          href={`https://t.me/${TELEGRAM_HANDLE}?text=${encodeURIComponent("Hello Mr. Mahmud\nI need some help.")}`}
          target="_blank" rel="noreferrer"
          className="flex flex-col items-center justify-center gap-4 p-8 bg-white border border-slate-200 rounded-3xl premium-card group"
        >
          <div className="w-16 h-16 bg-[#0088cc]/10 text-[#0088cc] rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0088cc] group-hover:text-white transition-all duration-300">
            <Send size={32} />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-900">Telegram Support</h3>
            <p className="text-slate-500 text-sm mt-1">Secure & reliable</p>
          </div>
        </a>
      </div>

      <div className="mt-12 p-6 bg-brand-50 rounded-2xl border border-brand-100 w-full max-w-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 flex-shrink-0 shadow-sm mx-auto sm:mx-0">
          <Mail size={24} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">For Business Inquiries</h4>
          <p className="text-slate-600 mt-1">Email us directly at <a href="mailto:trustedsubstore@gmail.com" className="font-medium text-brand-600 hover:underline">trustedsubstore@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}

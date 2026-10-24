import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { persistentStore, onStoreUpdate } from '../utils/persistentStore';
import { MessageCircle, ShieldCheck, X, Sparkles, PhoneCall, ExternalLink } from 'lucide-react';

export const WhatsAppSupportButton: React.FC = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [supportNumber, setSupportNumber] = useState('01811223344');
  const [supportNotice, setSupportNotice] = useState('অফিসিয়াল হোয়াটসঅ্যাপ সাপোর্ট ডেস্ক');

  const loadSupportSettings = () => {
    persistentStore.getPaymentSettings().then(settings => {
      if (settings.supportWhatsapp) {
        setSupportNumber(settings.supportWhatsapp);
      }
      if (settings.supportNotice) {
        setSupportNotice(settings.supportNotice);
      }
    });
  };

  useEffect(() => {
    loadSupportSettings();
    const unsubscribe = onStoreUpdate(e => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'payments') {
        loadSupportSettings();
      }
    });
    return unsubscribe;
  }, []);

  const digits = supportNumber.replace(/\D/g, '');
  const cleanNum = digits.startsWith('880')
    ? digits
    : digits.startsWith('0')
    ? `88${digits}`
    : `880${digits}`;

  const userIdentifier = currentUser ? `(User: ${currentUser.name}, Email: ${currentUser.email})` : '';
  const message = encodeURIComponent(
    `আসসালামু আলাইকুম VaiVaiZone সাপোর্ট টিম! আমি Reseller পোর্টাল থেকে যোগাযোগ করছি ${userIdentifier}। আমার সহায়তা প্রয়োজন।`
  );

  const whatsappUrl = `https://wa.me/${cleanNum}?text=${message}`;

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-none">
      
      {/* Expanded Quick Chat Card */}
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-72 sm:w-80 rounded-3xl bg-slate-900/95 border border-emerald-500/30 p-4 shadow-2xl backdrop-blur-md text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
                  <MessageCircle className="w-5 h-5 fill-slate-950 text-slate-950" />
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>VaiVaiZone 24/7 Support</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400">
                    LIVE
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  {supportNotice || 'অফিসিয়াল হোয়াটসঅ্যাপ সাপোর্ট ডেস্ক'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 text-xs space-y-2 text-slate-300">
            <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-[11px] leading-relaxed">
              👋 স্বাগতম! ডিপোজিট ভেরিফিকেশন বা যেকোনো সহায়তায় সরাসরি হোয়াটসঅ্যাপে মেসেজ দিন:
              <div className="mt-1 font-mono font-bold text-emerald-400 text-xs">
                +{cleanNum}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-semibold px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>নিরাপদ ও অফিশিয়াল রিসেলার হেল্পলাইন</span>
            </div>
          </div>

          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-98"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950" />
            <span>হোয়াটসঅ্যাপে চ্যাট শুরু করুন</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Circular Floating WhatsApp Button */}
      <div className="pointer-events-auto relative group">
        
        {/* Subtle hover tooltip when closed */}
        {!isOpen && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-bold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>২৪/৭ লাইভ সাপোর্ট</span>
          </div>
        )}

        {/* Pulse animated ring */}
        <span className="absolute -inset-1 rounded-full bg-emerald-500/30 blur-sm animate-pulse group-hover:bg-emerald-400/40 pointer-events-none" />

        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-400 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-2 border-emerald-300/40 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none"
          title="WhatsApp Support (২৪/৭ লাইভ চ্যাট)"
          aria-label="WhatsApp Support"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              {/* Official WhatsApp Logo Icon */}
              <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                <path d="M12.031 2C6.516 2 2.016 6.5 2.016 12.016c0 1.953.563 3.781 1.531 5.344L2 22l4.828-1.516c1.484.844 3.203 1.344 5.203 1.344 5.516 0 10.016-4.5 10.016-10.016 0-5.516-4.5-10.012-10.016-10.012zm5.828 14.391c-.25.688-1.453 1.281-2.016 1.328-.563.047-1.281.078-4.094-1.078-3.406-1.406-5.594-4.891-5.766-5.109-.172-.234-1.375-1.828-1.375-3.484 0-1.656.875-2.469 1.188-2.813.313-.344.688-.438.922-.438.234 0 .469 0 .688.016.234.016.531-.094.828.625.313.75 1.063 2.594 1.156 2.781.094.188.156.406.031.641-.125.234-.188.375-.375.594-.188.219-.406.484-.578.656-.188.188-.391.391-.172.766.219.375.984 1.625 2.109 2.625 1.453 1.297 2.672 1.703 3.047 1.891.375.188.594.156.813-.094.219-.25.938-1.094 1.188-1.469.25-.375.5-.313.844-.188.344.125 2.188 1.031 2.563 1.219.375.188.625.281.719.438.094.156.094.906-.156 1.594z" />
              </svg>

              {/* Online Green Radar Dot */}
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute top-0.5 right-0.5 border-2 border-slate-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

import { X, Bell, Megaphone, Sparkles, CheckCircle, Trash2, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { Notification } from '../types';
import { toBengaliNumber } from '../utils/bengali';

interface NotificationModalProps {
  announcement: string;
  personalNotifications: Notification[];
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  announcement,
  personalNotifications,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="w-full max-w-sm bg-[#111c16] border border-emerald-900/80 rounded-3xl p-5 text-white shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm">ঘোষণা ও আপডেট</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto no-scrollbar pr-1">
          {/* Main Admin Announcement */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-[#12281c] border border-emerald-500/40 shrink-0">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
              <Megaphone className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider">অফিসিয়াল নোটিশ</span>
            </div>
            <p className="text-slate-100 text-xs font-medium leading-relaxed">
              {announcement || 'ReelPay BD তে আপনাকে স্বাগতম! নিয়মিত রিল দেখুন আর টাকা বিকাশ/নগদে বুঝে নিন।'}
            </p>
          </div>

          {/* Personal Notifications List */}
          {personalNotifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-1">আপনার জন্য নোটিফিকেশন</h4>
              {personalNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="p-3 rounded-2xl bg-[#0c1410] border border-emerald-950/50 flex gap-3 animate-in fade-in slide-in-from-left-2"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    notif.type === 'reel_deleted' ? 'bg-rose-950 text-rose-400' :
                    notif.type === 'deposit' ? 'bg-cyan-950 text-cyan-400' :
                    notif.type === 'withdrawal' ? 'bg-emerald-950 text-emerald-400' :
                    'bg-blue-950 text-blue-400'
                  }`}>
                    {notif.type === 'reel_deleted' && <Trash2 className="w-4 h-4" />}
                    {notif.type === 'deposit' && <CreditCard className="w-4 h-4" />}
                    {notif.type === 'withdrawal' && <Wallet className="w-4 h-4" />}
                    {notif.type === 'general' && <AlertCircle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[11px] text-white leading-tight">{notif.title}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">{notif.message}</p>
                    <p className="text-[9px] text-neutral-600 mt-1">{new Date(notif.createdAt).toLocaleString('bn-BD', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Earning Tip */}
          <div className="p-3 rounded-2xl bg-[#14231b] border border-emerald-950">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px]">প্রতিদিনের আয় বৃদ্ধি করার নিয়ম:</span>
            </div>
            <p className="text-neutral-300 text-[10px] leading-relaxed">
              ১. প্রতিদিন অন্তত ৫-১০টি রিল সম্পূর্ণ দেখুন।<br />
              ২. স্পিন হুইল ও স্ক্র্যাচ কার্ড খেলুন।<br />
              ৩. বন্ধুদের রেফার করে ৫০০ পয়েন্ট বোনাস নিন।
            </p>
          </div>

          {/* Payment Notice */}
          <div className="p-3 rounded-2xl bg-[#14231b] border border-emerald-950 flex items-start gap-2 text-neutral-300 text-[10px]">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              সব ধরণের উত্তোলন ২৪ ঘণ্টার মধ্যে বিকাশ, নগদ বা রকেট নাম্বারে সরাসরি পাঠানো হয়।
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-[#00c853] hover:bg-[#00e676] text-black font-bold text-xs transition active:scale-95 shrink-0"
        >
          ঠিক আছে
        </button>
      </div>
    </div>
  );
};

import { Home, Sparkles, Wallet, User as UserIcon, Plus, Settings } from 'lucide-react';

export type TabType = 'home' | 'earn' | 'wallet' | 'profile' | 'admin';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenCreate: () => void;
  lang?: 'bn' | 'en';
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenCreate,
  lang = 'bn',
  isAdmin = false,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#09110d]/95 backdrop-blur-md border-t border-emerald-950/60 max-w-md mx-auto">
      <div className="flex items-center justify-around px-2 py-2">
        {/* হোম (Home) */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition cursor-pointer ${
            activeTab === 'home' ? 'text-[#00e676]' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] font-semibold">
            {lang === 'bn' ? 'হোম' : 'Home'}
          </span>
        </button>

        {/* আয় করুন / এক্সপ্লোর (Earn) */}
        <button
          onClick={() => onChangeTab('earn')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition cursor-pointer ${
            activeTab === 'earn' ? 'text-[#00e676]' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${activeTab === 'earn' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] font-semibold">
            {lang === 'bn' ? 'আয় করুন' : 'Earn'}
          </span>
        </button>

        {/* Center Create Button (+) matching Screenshot 2 */}
        <button
          onClick={onOpenCreate}
          className="flex flex-col items-center -mt-4 cursor-pointer group"
          title="নতুন রিল তৈরি করুন"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00c853] to-[#00e676] text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-[10px] font-bold text-neutral-300 mt-0.5">
            {lang === 'bn' ? 'তৈরি' : 'Create'}
          </span>
        </button>

        {/* ওয়ালেট (Wallet) */}
        <button
          onClick={() => onChangeTab('wallet')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition cursor-pointer ${
            activeTab === 'wallet' ? 'text-[#00e676]' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Wallet className={`w-5 h-5 ${activeTab === 'wallet' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] font-semibold">
            {lang === 'bn' ? 'ওয়ালেট' : 'Wallet'}
          </span>
        </button>

        {/* প্রোফাইল (Profile) */}
        <button
          onClick={() => onChangeTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition cursor-pointer ${
            activeTab === 'profile' ? 'text-[#00e676]' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <UserIcon className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] font-semibold">
            {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
          </span>
        </button>
      </div>
    </nav>
  );
};

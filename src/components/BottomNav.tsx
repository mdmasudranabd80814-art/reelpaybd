import React from 'react';
import { Home, Sparkles, Wallet, User as UserIcon, Plus } from 'lucide-react';
import { vibrateLight } from '../utils/haptics';

export type TabType = 'home' | 'earn' | 'wallet' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenCreate: () => void;
  lang?: 'bn' | 'en';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenCreate,
  lang = 'bn',
}) => {
  const navBtn = (tab: TabType, icon: React.ReactNode, label: string) => {
    const active = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => {
          vibrateLight();
          onChangeTab(tab);
        }}
        className={`relative min-w-[56px] min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition cursor-pointer ${
          active ? 'text-[#00e676]' : 'text-neutral-400 hover:text-neutral-200'
        }`}
      >
        {active && (
          <span className="absolute top-0 w-6 h-0.5 rounded-full bg-[#00e676]" />
        )}
        {icon}
        <span className="text-[11px] font-bold leading-none">{label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#09110d]/95 backdrop-blur-md border-t border-emerald-900/50 max-w-md mx-auto">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navBtn(
          'home',
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />,
          lang === 'bn' ? 'হোম' : 'Home'
        )}
        {navBtn(
          'earn',
          <Sparkles className={`w-5 h-5 ${activeTab === 'earn' ? 'stroke-[2.5]' : ''}`} />,
          lang === 'bn' ? 'আয় করুন' : 'Earn'
        )}

        <button
          type="button"
          onClick={() => {
            vibrateLight();
            onOpenCreate();
          }}
          className="flex flex-col items-center -mt-3.5 cursor-pointer group px-2"
          title={lang === 'bn' ? 'নতুন রিল বা লাইভ' : 'Create reel or go live'}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00c853] to-[#00e676] text-black flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-6 h-6 stroke-[2.75]" />
          </div>
          <span className="text-[10px] font-bold text-neutral-300 mt-1 leading-none">
            {lang === 'bn' ? 'তৈরি' : 'Create'}
          </span>
        </button>

        {navBtn(
          'wallet',
          <Wallet className={`w-5 h-5 ${activeTab === 'wallet' ? 'stroke-[2.5]' : ''}`} />,
          lang === 'bn' ? 'ওয়ালেট' : 'Wallet'
        )}
        {navBtn(
          'profile',
          <UserIcon className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />,
          lang === 'bn' ? 'প্রোফাইল' : 'Profile'
        )}
      </div>
    </nav>
  );
};

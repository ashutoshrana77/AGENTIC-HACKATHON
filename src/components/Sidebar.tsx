import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  SlidersHorizontal,
  FileText,
  Sliders,
  Settings2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { LivingMoneyModel } from '../types/finance.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: LivingMoneyModel;
  onOpenRules: () => void;
  onResetData: () => void;
  unresolvedNudgeCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  onOpenRules,
  onResetData,
  unresolvedNudgeCount,
}) => {
  const mainNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    {
      id: 'subscriptions',
      label: 'Subscriptions & Bills',
      icon: Repeat,
      count: unresolvedNudgeCount > 0 ? unresolvedNudgeCount : undefined,
    },
    { id: 'living-model', label: 'Living Money Model', icon: Sliders },
  ];

  const planningNav = [
    { id: 'ai-coach', label: 'Financial Assistant', icon: Sparkles },
    { id: 'simulator', label: 'Scenario Simulator', icon: SlidersHorizontal },
    { id: 'reports', label: 'Monthly Statement', icon: FileText },
  ];

  return (
    <aside className="w-60 bg-white border-r border-[#E8EBE7] flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Lockup */}
        <div className="h-14 px-5 border-b border-[#E8EBE7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#237A57] flex items-center justify-center text-white font-bold text-xs">
              F
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#202521]">Finmate</span>
          </div>
          <span className="text-[10px] font-mono font-medium text-[#777F79] bg-[#F1F3F0] px-1.5 py-0.5 rounded border border-[#E8EBE7]">
            v2.4
          </span>
        </div>

        {/* Nav Section: Core Ledger */}
        <div className="p-3 space-y-0.5">
          <div className="px-3 pt-3 pb-1.5 text-[10px] font-semibold tracking-wider text-[#777F79] uppercase">
            Ledger & Accounts
          </div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#F1F3F0] text-[#202521] font-semibold'
                    : 'text-[#777F79] hover:text-[#202521] hover:bg-[#F8F9F7]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#237A57]' : 'text-[#777F79]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count && (
                  <span className="text-[10px] font-mono font-semibold text-[#237A57] bg-[#237A57]/10 px-1.5 py-0.2 rounded">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Nav Section: Intelligence & Analysis */}
        <div className="p-3 pt-0 space-y-0.5">
          <div className="px-3 pt-3 pb-1.5 text-[10px] font-semibold tracking-wider text-[#777F79] uppercase">
            Intelligence & Planning
          </div>
          {planningNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#F1F3F0] text-[#202521] font-semibold'
                    : 'text-[#777F79] hover:text-[#202521] hover:bg-[#F8F9F7]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#237A57]' : 'text-[#777F79]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Rules & Admin Utility */}
        <div className="p-3 pt-0 space-y-0.5">
          <div className="px-3 pt-3 pb-1.5 text-[10px] font-semibold tracking-wider text-[#777F79] uppercase">
            System
          </div>
          <button
            onClick={onOpenRules}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#777F79] hover:text-[#202521] hover:bg-[#F8F9F7] transition-colors"
          >
            <Settings2 className="w-4 h-4 text-[#777F79]" />
            <span>Category Rules</span>
          </button>
          <button
            onClick={onResetData}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#777F79] hover:text-rose-700 hover:bg-rose-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-[#777F79]" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* User Account Tile */}
      <div className="p-3 border-t border-[#E8EBE7] bg-[#FDFDFD]">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
          <img
            src="/src/assets/images/avatar_user_profile_1793438782551.jpg"
            alt={profile.userName}
            className="w-8 h-8 rounded-md object-cover border border-[#E8EBE7] shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-[#202521] truncate">{profile.userName}</div>
            <div className="text-[11px] text-[#777F79] truncate">{profile.userRole}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

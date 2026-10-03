import React from 'react';
import { Lock, LogOut, Dices, BellRing, Sparkles, Mail, Heart, Users, Edit2 } from 'lucide-react';
import { AppStats } from '../lib/data';
import { useMusic } from './MusicPlayer';

export type MainTabType = 'classroom' | 'lottery' | 'mailbox' | 'memory';

interface HeaderProps {
  stats: AppStats;
  isAdmin: boolean;
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  onAdminClick: () => void;
  onGateClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isAdmin,
  activeTab,
  onSelectTab,
  onAdminClick,
  onGateClick,
}) => {
  const { isPlaying, isCharPlaying, musicConfig, toggleMusic, openEditModal } = useMusic();
  const isAnyMusicActive = isPlaying || isCharPlaying;

  return (
    <header className="fixed top-0 w-full z-50 glass-card border-b border-white/60 shadow-md backdrop-blur-xl transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo & Subtitle */}
        <div 
          onClick={onGateClick}
          className="flex items-center space-x-3 cursor-pointer group"
          title="Bấm để ra Cổng Trường gõ chuông 🔔"
        >
          <div className="text-2xl bg-white/80 p-2 rounded-2xl shadow-sm border border-pink-100 group-hover:scale-110 transition-transform">
            🎀
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#5e35b1] tracking-tight flex items-center gap-1.5">
              <span>Mầm Non Rắn Con</span>
              <span className="text-xs bg-[#FFDEF9] text-pink-700 px-2 py-0.5 rounded-full font-bold hidden md:inline-block">
                🌸 Chủ nhiệm Xà Nữ
              </span>
            </h1>
            <p className="text-[11px] text-purple-700 opacity-80 hidden sm:block font-medium">
              🍼 Vũ trụ ngọt ngào của Cô Giáo Chủ Nhiệm Xà Nữ
            </p>
          </div>
        </div>

        {/* Navigation Pills (MỤC RIÊNG BIỆT) */}
        <nav className="hidden md:flex items-center space-x-2">
          {/* Cổng trường */}
          <button 
            onClick={onGateClick}
            className="px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-[#FFDEF9] text-xs font-bold transition-all border border-white/80 shadow-xs text-purple-900 flex items-center gap-1 cursor-pointer"
          >
            <BellRing size={14} className="text-pink-600" /> Cổng Trường
          </button>

          {/* Mục 1: Lớp Bé Ngoan */}
          <button 
            onClick={() => onSelectTab('classroom')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'classroom'
                ? 'bg-gradient-to-r from-[#DFD1FF] to-[#FFDEF9] text-purple-950 font-black border-2 border-white shadow-sm scale-102'
                : 'bg-white/70 hover:bg-[#FFE8F7] text-purple-900 border-white/80'
            }`}
          >
            <Users size={14} className="text-purple-700" />
            <span>🎒 Lớp Bé Ngoan</span>
            <span className="bg-pink-200 text-pink-800 px-2 py-0.2 rounded-full text-[10px] font-extrabold">
              {stats.studentCount}
            </span>
          </button>

          {/* Mục 2: Bốc Thăm Bé Chồng (MỤC RIÊNG BIỆT) */}
          <button 
            onClick={() => onSelectTab('lottery')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'lottery'
                ? 'bg-gradient-to-r from-[#DFD1FF] to-[#FFDEF9] text-purple-950 font-black border-2 border-white shadow-md scale-105'
                : 'bg-white/70 hover:bg-[#FFE8F7] text-purple-900 border-white/80'
            }`}
          >
            <Dices size={14} className="text-purple-700" />
            <span>🎲 Bốc Thăm Bé Chồng</span>
            <span className="bg-pink-400 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">Hot</span>
          </button>

          {/* Mục 3: Hộp Thư Bí Mật (MỤC RIÊNG BIỆT) */}
          <button 
            onClick={() => onSelectTab('mailbox')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mailbox'
                ? 'bg-gradient-to-r from-[#DFD1FF] to-[#FFDEF9] text-purple-950 font-black border-2 border-white shadow-md scale-105'
                : 'bg-white/70 hover:bg-[#FFE8F7] text-purple-900 border-white/80'
            }`}
          >
            <Mail size={14} className="text-pink-600" />
            <span>💌 Hộp Thư Bí Mật</span>
          </button>

          {/* Mục 4: Góc Lưu Niệm */}
          <button 
            onClick={() => onSelectTab('memory')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-gradient-to-r from-[#DFD1FF] to-[#FFDEF9] text-purple-950 font-black border-2 border-white shadow-md scale-105'
                : 'bg-white/70 hover:bg-[#FFE8F7] text-purple-900 border-white/80'
            }`}
          >
            <Heart size={14} className="text-pink-500" />
            <span>🌸 Góc Lưu Niệm</span>
          </button>
        </nav>

        {/* Right Action: Music Player + Admin Area */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Nút nhạc nền đặt ngay bên cạnh nút đăng nhập Admin */}
          <button
            onClick={toggleMusic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              isAnyMusicActive 
                ? 'bg-[#FFE8F7] border-pink-200 text-[#b85b88] font-bold shadow-pink-100/50' 
                : 'bg-white/80 border-purple-100 text-[#644973] hover:bg-[#EDE4FF]'
            }`}
            title={isAnyMusicActive ? `Bấm để tắt nhạc ngay (${musicConfig.title})` : `Bấm để bật nhạc nền (${musicConfig.title})`}
          >
            <span className={isAnyMusicActive ? 'animate-bounce' : ''}>{isAnyMusicActive ? '🎵' : '🔇'}</span>
            <span className="hidden sm:inline max-w-[110px] truncate">
              {isAnyMusicActive ? 'Tắt nhạc 🎶' : 'Bật nhạc'}
            </span>
            {isAnyMusicActive && (
              <span className="flex items-center gap-0.5 ml-0.5 h-3">
                <span className="w-0.5 h-2 bg-pink-400 rounded-full animate-pulse"></span>
                <span className="w-0.5 h-3 bg-pink-500 rounded-full animate-pulse"></span>
                <span className="w-0.5 h-1.5 bg-pink-400 rounded-full animate-pulse"></span>
              </span>
            )}
          </button>

          {/* Nút Admin đổi bài hát nhạc nền nếu đang đăng nhập admin */}
          {isAdmin && (
            <button
              onClick={openEditModal}
              className="p-1.5 rounded-full bg-white/80 hover:bg-[#EDE4FF] text-purple-900 border border-purple-200 shadow-2xs cursor-pointer transition-transform hover:scale-105"
              title="Admin: Đổi bài hát nhạc nền YouTube"
            >
              <Edit2 size={13} />
            </button>
          )}

          {/* Nút đăng nhập Admin */}
          <button 
            onClick={onAdminClick}
            className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm border border-white transition-all cursor-pointer ${
              isAdmin 
                ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' 
                : 'bg-[#DCD2FF] text-purple-950 hover:bg-purple-300'
            }`}
          >
            {isAdmin ? <LogOut size={15} /> : <Lock size={15} />}
            <span className="hidden sm:inline">{isAdmin ? 'Thoát Admin' : 'Khu Vực Admin'}</span>
          </button>
        </div>

      </div>

      {/* Mobile Secondary Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-1.5 bg-white/80 border-t border-purple-100 backdrop-blur-md overflow-x-auto gap-1">
        <button
          onClick={() => onSelectTab('classroom')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer border ${
            activeTab === 'classroom' ? 'bg-[#EDE4FF] text-purple-950 border-purple-300' : 'text-purple-900 bg-white/80 border-transparent'
          }`}
        >
          🎒 Lớp Bé Ngoan
        </button>

        <button
          onClick={() => onSelectTab('lottery')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer border ${
            activeTab === 'lottery' ? 'bg-[#FFE8F7] text-purple-950 border-pink-300' : 'text-purple-900 bg-white/80 border-transparent'
          }`}
        >
          🎲 Bốc Thăm Bé Chồng
        </button>

        <button
          onClick={() => onSelectTab('mailbox')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer border ${
            activeTab === 'mailbox' ? 'bg-[#FFE8F7] text-purple-950 border-orange-200' : 'text-purple-900 bg-white/80 border-transparent'
          }`}
        >
          💌 Hộp Thư Bí Mật
        </button>

        <button
          onClick={() => onSelectTab('memory')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer border ${
            activeTab === 'memory' ? 'bg-[#EDE4FF] text-purple-950 border-purple-200' : 'text-purple-900 bg-white/80 border-transparent'
          }`}
        >
          🌸 Kỷ Niệm
        </button>
      </div>
    </header>
  );
};

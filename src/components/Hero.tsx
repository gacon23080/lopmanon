import React from 'react';
import { Sparkles, Edit3, HeartHandshake, ExternalLink, Volume2, VolumeX, Edit2 } from 'lucide-react';
import { AppStats, TeacherProfile } from '../lib/data';
import { useMusic } from './MusicPlayer';

interface HeroProps {
  stats: AppStats;
  teacherProfile: TeacherProfile;
  isAdmin: boolean;
  onEditTeacher: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  stats,
  teacherProfile,
  isAdmin,
  onEditTeacher,
}) => {
  const { isPlaying, isCharPlaying, musicConfig, toggleMusic, openEditModal } = useMusic();
  return (
    <section className="relative">
      {/* Khung profile cô giáo - Tông màu pastel ngọt ngào & viền thanh lịch */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 max-w-3xl mx-auto relative shadow-xs border border-purple-100/80 bg-[#FFFDF9]/95 backdrop-blur-md">
        
        {/* Top Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-purple-100/60">
          <div className="flex items-center gap-2">
            <div className="bg-[#FFEBF8] px-3 py-1 rounded-full text-xs font-semibold text-[#b85b88] shadow-2xs border border-pink-100 flex items-center gap-1.5">
              <Sparkles size={12} className="text-pink-400" /> Cô Giáo Chủ Nhiệm
            </div>
            <div className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-[#644973] shadow-2xs border border-purple-100/70">
              🏫 Sĩ số: {stats.studentCount} bé ngoan
            </div>
          </div>

          <div className="flex items-center gap-2">
            {teacherProfile.commissionStatus && (
              <div className="bg-[#FFFDF9] px-3 py-1 rounded-full text-xs font-medium text-[#8a5b78] shadow-2xs border border-purple-100/70 flex items-center gap-1">
                <HeartHandshake size={13} className="text-pink-400" />
                <span>{teacherProfile.commissionStatus}</span>
              </div>
            )}

            {isAdmin && (
              <button
                onClick={onEditTeacher}
                className="inline-flex items-center justify-center gap-1.5 bg-[#F4ECFF] hover:bg-[#ebe0fc] text-[#5e4373] text-xs font-semibold px-3 py-1 rounded-full border border-purple-100 shadow-2xs transition-colors cursor-pointer"
                title="Chỉnh sửa thông tin hồ sơ cô giáo"
              >
                <Edit3 size={12} /> Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>

        {/* Nội dung hồ sơ cô giáo */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
          
          {/* Avatar Area */}
          <div className="relative shrink-0 flex flex-col items-center group">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-tr from-[#F4ECFF] via-[#FFEBF8] to-[#FFFDF9] p-1.5 shadow-2xs rotate-1 group-hover:rotate-0 transition-transform duration-300">
              <div className="w-full h-full rounded-[1.1rem] bg-white overflow-hidden flex items-center justify-center relative shadow-inner">
                {teacherProfile.avatarUrl ? (
                  <img
                    src={teacherProfile.avatarUrl}
                    alt={teacherProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center mb-1 shadow-inner border border-purple-100/70">
                      <span className="text-2xl">🌸</span>
                    </div>
                    <p className="text-[10px] font-semibold text-[#644973] leading-tight">
                      Xà Nữ Bạch Kim<br />
                      <span className="text-[9px] text-[#b85b88] font-normal">Chủ Nhiệm Rắn Con</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Decorative Badges on Avatar */}
            <div className="absolute -top-2 -left-2 text-2xl drop-shadow-xs animate-bounce" style={{ animationDuration: '3s' }}>
              🎀
            </div>
            <div className="absolute top-24 -right-1 bg-white rounded-full p-1.5 shadow-2xs border border-[#F4ECFF]">
              <span className="text-base block">🐍</span>
            </div>

            {/* Admin Quick Edit Button */}
            {isAdmin && (
              <button
                onClick={onEditTeacher}
                className="absolute top-12 m-auto w-fit h-fit bg-[#5e4373]/85 hover:bg-[#5e4373] text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer z-10"
              >
                <Edit3 size={11} /> Đổi ảnh
              </button>
            )}

            {/* Facebook Link */}
            {teacherProfile.facebookUrl ? (
              <a
                href={teacherProfile.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2]/15 text-[#1877F2] border border-[#1877F2]/25 text-[11px] font-semibold shadow-2xs transition-all hover:scale-103 cursor-pointer"
                title="Mở trang Facebook của Cô Giáo"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px] font-bold">f</span>
                <span>Facebook Cô Giáo 🌸</span>
                <ExternalLink size={10} />
              </a>
            ) : isAdmin ? (
              <button
                onClick={onEditTeacher}
                className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 cursor-pointer"
              >
                + Thêm link Facebook
              </button>
            ) : null}
          </div>

          {/* Info Area */}
          <div className="flex-1 text-center sm:text-left space-y-2.5 w-full">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#5e4373] mb-0.5">
                {teacherProfile.name}
              </h2>
              <p className="text-xs font-semibold text-[#b85b88]">
                {teacherProfile.title}
              </p>
            </div>
            
            {/* Quote Box */}
            {teacherProfile.quote && (
              <div className="bg-[#FFFDF9] rounded-xl px-3 py-2 border border-purple-100/60 shadow-inner inline-block w-full text-center sm:text-left">
                <p className="italic text-[#644973] font-normal text-xs leading-relaxed">
                  “{teacherProfile.quote}”
                </p>
              </div>
            )}

            {/* Bio Box */}
            {teacherProfile.bio && (
              <div className="bg-white rounded-xl p-3 border border-purple-100/50 text-[#5e496a] text-xs leading-relaxed whitespace-pre-wrap shadow-2xs">
                {teacherProfile.bio}
              </div>
            )}

            {/* 🎵 Nhạc nền của lớp học */}
            <div className="pt-1">
              <div className="bg-gradient-to-r from-[#F4ECFF]/80 via-[#FFEBF8]/80 to-[#FFFDF9] p-2.5 rounded-2xl border border-purple-100/70 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs shrink-0 ${
                    isPlaying && !isCharPlaying ? 'bg-pink-100 text-[#b85b88] animate-pulse' : 'bg-white text-[#8b609e]'
                  }`}>
                    {isPlaying && !isCharPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[10px] font-semibold text-[#8b609e] flex items-center gap-1">
                      <span>🎶 Nhạc Nền Lớp Học</span>
                      {isPlaying && !isCharPlaying && (
                        <span className="flex items-center gap-0.5 h-2.5">
                          <span className="w-0.5 h-2 bg-pink-400 rounded-full animate-pulse"></span>
                          <span className="w-0.5 h-3 bg-pink-500 rounded-full animate-pulse"></span>
                          <span className="w-0.5 h-1.5 bg-pink-400 rounded-full animate-pulse"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#5e4373] truncate max-w-[200px] sm:max-w-xs">
                      {isCharPlaying ? '🎵 Nhạc nhân vật đang phát' : musicConfig.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Nút Bật / Tắt Phát Nhạc */}
                  <button
                    onClick={toggleMusic}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs border transition-all cursor-pointer hover:scale-102 active:scale-98 flex items-center gap-1 ${
                      isPlaying && !isCharPlaying
                        ? 'bg-[#FFEBF8] border-pink-200 text-[#b85b88]' 
                        : 'bg-white border-purple-100 text-[#644973] hover:bg-[#F4ECFF]'
                    }`}
                  >
                    {isPlaying && !isCharPlaying ? 'Tắt nhạc' : 'Phát nhạc 🎵'}
                  </button>

                  {/* Nút Đổi Nhạc của Admin */}
                  {isAdmin && (
                    <button
                      onClick={openEditModal}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#F4ECFF] text-[#8b609e] border border-purple-100 shadow-2xs cursor-pointer transition-colors"
                      title="Đổi bài hát nhạc nền"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

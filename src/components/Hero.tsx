import React from 'react';
import { Sparkles, Edit3, HeartHandshake, ExternalLink, Volume2, VolumeX, Music, Edit2 } from 'lucide-react';
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
  const { isPlaying, musicConfig, toggleMusic, openEditModal } = useMusic();
  return (
    <section className="relative">
      {/* Khung profile cô giáo được tối ưu nhỏ gọn, hiển thị toàn diện và không bị mất phần trên */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 max-w-3xl mx-auto relative shadow-md border-3 border-white/90 bg-[#FFFBF5]/90 backdrop-blur-md">
        
        {/* Top Badges Bar - Tích hợp gọn gàng ngay đầu khung, tuyệt đối không bị thanh header che mất */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-purple-100/70">
          <div className="flex items-center gap-2">
            <div className="bg-[#FFE8F7] px-3 py-1 rounded-full text-xs font-black text-pink-700 shadow-2xs border border-white flex items-center gap-1.5">
              <Sparkles size={12} /> Cô Giáo Chủ Nhiệm
            </div>
            <div className="bg-white px-3 py-1 rounded-full text-xs font-black text-purple-900 shadow-2xs border border-purple-100">
              🏫 Sĩ số: {stats.studentCount} bé ngoan
            </div>
          </div>

          <div className="flex items-center gap-2">
            {teacherProfile.commissionStatus && (
              <div className="bg-[#FFFBF5] px-3 py-1 rounded-full text-xs font-bold text-orange-900 shadow-2xs border border-purple-100 flex items-center gap-1">
                <HeartHandshake size={13} className="text-pink-400" />
                <span>{teacherProfile.commissionStatus}</span>
              </div>
            )}

            {isAdmin && (
              <button
                onClick={onEditTeacher}
                className="inline-flex items-center justify-center gap-1.5 bg-[#EDE4FF] hover:bg-[#ded2fb] text-purple-950 text-xs font-bold px-3 py-1 rounded-full border border-white shadow-2xs transition-colors cursor-pointer"
                title="Chỉnh sửa thông tin hồ sơ cô giáo"
              >
                <Edit3 size={12} /> Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>

        {/* Nội dung hồ sơ cô giáo (Avatar + Thông tin) */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
          
          {/* Avatar Area with Teacher Photo & Facebook Link Underneath */}
          <div className="relative shrink-0 flex flex-col items-center group">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-tr from-[#EDE4FF] via-[#FFE8F7] to-[#FFFBF5] p-1.5 shadow-sm rotate-1 group-hover:rotate-0 transition-transform duration-300">
              <div className="w-full h-full rounded-[1.1rem] bg-white overflow-hidden flex items-center justify-center relative shadow-inner">
                {teacherProfile.avatarUrl ? (
                  <img
                    src={teacherProfile.avatarUrl}
                    alt={teacherProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* Cute Default Anime Avatar */
                  <div className="text-center p-2">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center mb-1 shadow-inner border border-purple-100">
                      <span className="text-2xl">🌸</span>
                    </div>
                    <p className="text-[10px] font-bold text-purple-800 leading-tight">
                      Xà Nữ Bạch Kim<br />
                      <span className="text-[9px] text-pink-500 font-normal">Chủ Nhiệm Rắn Con</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Decorative Badges on Avatar */}
            <div className="absolute -top-2 -left-2 text-2xl drop-shadow-xs animate-bounce" style={{ animationDuration: '3s' }}>
              🎀
            </div>
            <div className="absolute top-24 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-[#EDE4FF]">
              <span className="text-base block">🐍</span>
            </div>

            {/* Admin Quick Edit Button on Avatar */}
            {isAdmin && (
              <button
                onClick={onEditTeacher}
                className="absolute top-12 m-auto w-fit h-fit bg-purple-900/80 hover:bg-purple-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer z-10"
              >
                <Edit3 size={11} /> Đổi ảnh
              </button>
            )}

            {/* Facebook Link under Avatar (Admin tự cập nhật) */}
            {teacherProfile.facebookUrl ? (
              <a
                href={teacherProfile.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/30 text-[11px] font-bold shadow-2xs transition-all hover:scale-105 cursor-pointer"
                title="Mở trang Facebook của Cô Giáo"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px] font-black">f</span>
                <span>Facebook Cô Giáo 🌸</span>
                <ExternalLink size={10} />
              </a>
            ) : isAdmin ? (
              <button
                onClick={onEditTeacher}
                className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 cursor-pointer"
              >
                + Thêm link Facebook
              </button>
            ) : null}
          </div>

          {/* Info Area */}
          <div className="flex-1 text-center sm:text-left space-y-2.5 w-full">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#523f6b] mb-0.5">
                {teacherProfile.name}
              </h2>
              <p className="text-xs font-bold text-pink-600">
                {teacherProfile.title}
              </p>
            </div>
            
            {/* Quote Box */}
            {teacherProfile.quote && (
              <div className="bg-[#FFFBF5] rounded-xl px-3 py-2 border border-orange-100/60 shadow-inner inline-block w-full text-center sm:text-left">
                <p className="italic text-gray-700 font-medium text-xs leading-relaxed">
                  “{teacherProfile.quote}”
                </p>
              </div>
            )}

            {/* Bio Box */}
            {teacherProfile.bio && (
              <div className="bg-white/80 rounded-xl p-3 border border-purple-50 text-gray-700 text-xs leading-relaxed whitespace-pre-wrap shadow-2xs">
                {teacherProfile.bio}
              </div>
            )}

            {/* 🎵 Nhạc nền của lớp học (Bật/Tắt & Điều khiển trực tiếp bên trong phòng của cô giáo) */}
            <div className="pt-1">
              <div className="bg-gradient-to-r from-[#EDE4FF]/80 via-[#FFE8F7]/80 to-[#FFFBF5] p-2.5 rounded-2xl border border-purple-100 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs shrink-0 ${
                    isPlaying ? 'bg-pink-200 text-pink-700 animate-pulse' : 'bg-white text-purple-700'
                  }`}>
                    {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[10px] font-black text-purple-600 flex items-center gap-1">
                      <span>🎶 Nhạc Nền Lớp Học</span>
                      {isPlaying && (
                        <span className="flex items-center gap-0.5 h-2.5">
                          <span className="w-0.5 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                          <span className="w-0.5 h-3 bg-pink-600 rounded-full animate-pulse"></span>
                          <span className="w-0.5 h-1.5 bg-pink-400 rounded-full animate-pulse"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-extrabold text-purple-950 truncate max-w-[200px] sm:max-w-xs">
                      {musicConfig.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Nút Bật / Tắt Phát Nhạc */}
                  <button
                    onClick={toggleMusic}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-xs border transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1 ${
                      isPlaying 
                        ? 'bg-[#FFE8F7] border-pink-300 text-pink-700' 
                        : 'bg-white border-purple-200 text-purple-900 hover:bg-[#EDE4FF]'
                    }`}
                  >
                    {isPlaying ? 'Tắt nhạc' : 'Phát nhạc 🎵'}
                  </button>

                  {/* Nút Đổi Nhạc của Admin */}
                  {isAdmin && (
                    <button
                      onClick={openEditModal}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#EDE4FF] text-purple-700 border border-purple-200 shadow-2xs cursor-pointer transition-colors"
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

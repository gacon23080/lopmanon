import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, HeartCrack, Cake, Calendar, BookOpen, Volume2, VolumeX, MessageSquare, ExternalLink, ShieldAlert, Edit2 } from 'lucide-react';
import { Character } from '../lib/data';
import { extractYouTubeId } from '../lib/youtube';
import { soundManager } from '../lib/audio';
import { useMusic } from './MusicPlayer';

interface CharacterDetailModalProps {
  character: Character;
  onClose: () => void;
  onOpenFeedback: (char: Character) => void;
  isAdmin?: boolean;
  onEditCharacter?: (char: Character) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  onClose,
  onOpenFeedback,
  isAdmin = false,
  onEditCharacter,
}) => {
  const { setCharPlaying } = useMusic();
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const youtubeId = extractYouTubeId(character.youtubeMusicUrl);

  // Khi nhạc của nhân vật bật -> Tự động dừng nhạc nền lớp học
  useEffect(() => {
    if (youtubeId && isPlayingMusic) {
      setCharPlaying(true);
    } else {
      setCharPlaying(false);
    }

    return () => {
      setCharPlaying(false);
    };
  }, [youtubeId, isPlayingMusic, setCharPlaying]);

  const toggleMusic = () => {
    if (iframeRef.current) {
      const nextState = !isPlayingMusic;
      const message = nextState
        ? '{"event":"command","func":"playVideo","args":""}'
        : '{"event":"command","func":"pauseVideo","args":""}';
      iframeRef.current.contentWindow?.postMessage(message, '*');
      setIsPlayingMusic(nextState);
      setCharPlaying(nextState && !!youtubeId);
      soundManager.playPop();
    }
  };

  useEffect(() => {
    soundManager.playSparkle();
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [youtubeId]);

  const linkTarget = character.linkUrl || character.googleAiLink;
  const linkText = character.linkLabel || "Mở Link Bé Rắn ✨";
  const storyText = character.story || character.plot || character.bio;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop tối mờ che phủ TOÀN BỘ màn hình */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md" 
        onClick={onClose} 
      />

      {/* Embedded In-App YouTube Audio Player for Character Theme */}
      {youtubeId && isPlayingMusic && (
        <div 
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '320px',
            height: '240px',
            opacity: 0.001,
            pointerEvents: 'none',
            zIndex: -9999,
          }}
        >
          <iframe
            ref={iframeRef}
            width="320"
            height="240"
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&loop=1&playlist=${youtubeId}&playsinline=1`}
            title={`Nhạc nền của ${character.name}`}
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        </div>
      )}

      {/* Main Modal Card */}
      <div className="bg-[#FFFDF9] rounded-3xl p-3.5 sm:p-5 w-full max-w-lg md:max-w-xl my-auto relative z-10 shadow-2xl border-2 border-purple-100 max-h-[82vh] flex flex-col animate-in zoom-in-95">
        
        {/* TOP HEADER PINNED */}
        <div className="shrink-0 flex items-center justify-between gap-2 border-b border-purple-100/70 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐍</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-bold text-[#5e4373] line-clamp-1">
                  {character.name}
                </h2>
                {character.is18Plus && (
                  <span className="bg-red-400 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs flex items-center gap-0.5 shrink-0">
                    <ShieldAlert size={10} /> 18+
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#9b6f98] font-medium line-clamp-1">
                Hồ sơ chi tiết & Cốt truyện bé rắn 🌸
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick in-app music toggle in header if available */}
            {youtubeId && (
              <button
                onClick={toggleMusic}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all shadow-2xs border cursor-pointer flex items-center gap-1 ${
                  isPlayingMusic 
                    ? 'bg-pink-50 border-pink-200 text-[#b85b88] animate-pulse' 
                    : 'bg-purple-50/50 border-purple-100 text-[#8a7294]'
                }`}
                title="Bật/Tắt nhạc nền của bé (nhạc nền trường sẽ tạm nhường tiếng)"
              >
                {isPlayingMusic ? <Volume2 size={12} /> : <VolumeX size={12} />}
                <span className="hidden xs:inline">{isPlayingMusic ? 'Nhạc bé 🎵' : 'Tắt'}</span>
              </button>
            )}

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="text-[#9e83a6] hover:text-[#5e4373] bg-white hover:bg-purple-50 rounded-full p-1.5 shadow-2xs border border-purple-100 cursor-pointer transition-transform hover:scale-105"
              title="Đóng hồ sơ"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MIDDLE CONTENT */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
          <div className="grid grid-cols-12 gap-3 items-start">
            
            {/* Ảnh đại diện dọc nhỏ gọn */}
            <div className="col-span-4 flex flex-col items-center">
              <div className="w-full aspect-[3/4] max-h-36 sm:max-h-40 rounded-xl overflow-hidden bg-gradient-to-tr from-[#F4ECFF] to-[#FFEBF8] border border-purple-100 shadow-2xs relative flex items-center justify-center">
                {character.imageUrl ? (
                  <img 
                    src={character.imageUrl} 
                    alt={character.name} 
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="text-center p-2 text-purple-300">
                    <span className="text-3xl block">🐍</span>
                    <span className="text-[9px] font-semibold text-[#7e608a]">Bé Rắn</span>
                  </div>
                )}

                {character.is18Plus && (
                  <div className="absolute top-1.5 right-1.5 bg-red-400 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                    18+
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 justify-center mt-1.5 w-full">
                {(character.tags || []).slice(0, 4).map((t) => {
                  const is18 = ['18+', 'r18', 'h+', 'nsfw', '+18'].includes(t.toLowerCase());
                  return (
                    <span 
                      key={t} 
                      className={`text-[9px] font-medium px-1.5 py-0.2 rounded-full border ${
                        is18 
                          ? 'bg-red-50 text-red-600 border-red-150' 
                          : 'bg-[#F4ECFF] text-[#6d4d7a] border-purple-100'
                      }`}
                    >
                      {is18 ? `🔞 ${t}` : t}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 4 Chỉ Số: Tuổi, Ngày Sinh, Thích, Ghét */}
            <div className="col-span-8 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {/* Tuổi */}
                <div className="bg-white rounded-xl p-2 border border-purple-100/70 shadow-2xs">
                  <div className="text-[10px] font-semibold text-[#8b609e] flex items-center gap-1">
                    <Cake size={11} className="text-pink-400" /> Tuổi
                  </div>
                  <div className="text-xs font-semibold text-[#5e4373] truncate mt-0.5">
                    {character.age || 'Đang cập nhật'}
                  </div>
                </div>

                {/* Ngày sinh */}
                <div className="bg-white rounded-xl p-2 border border-purple-100/70 shadow-2xs">
                  <div className="text-[10px] font-semibold text-[#8b609e] flex items-center gap-1">
                    <Calendar size={11} className="text-blue-400" /> Ngày sinh
                  </div>
                  <div className="text-xs font-semibold text-[#5e4373] truncate mt-0.5">
                    {character.birthday || 'Đang cập nhật'}
                  </div>
                </div>

                {/* Thích */}
                <div className="bg-white rounded-xl p-2 border border-purple-100/70 shadow-2xs">
                  <div className="text-[10px] font-semibold text-[#b85b88] flex items-center gap-1">
                    <Heart size={11} className="text-pink-400 fill-pink-400" /> Thích
                  </div>
                  <div className="text-[11px] font-medium text-[#644973] truncate mt-0.5" title={character.likes}>
                    {character.likes || 'Đang cập nhật'}
                  </div>
                </div>

                {/* Ghét */}
                <div className="bg-white rounded-xl p-2 border border-purple-100/70 shadow-2xs">
                  <div className="text-[10px] font-semibold text-rose-500 flex items-center gap-1">
                    <HeartCrack size={11} className="text-rose-400" /> Ghét
                  </div>
                  <div className="text-[11px] font-medium text-[#644973] truncate mt-0.5" title={character.dislikes}>
                    {character.dislikes || 'Đang cập nhật'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Story / Cốt truyện chi tiết */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-purple-100/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-purple-50 pb-1.5">
              <h3 className="text-xs font-bold text-[#6d4d7a] flex items-center gap-1.5 uppercase tracking-wide">
                <BookOpen size={14} className="text-[#8b609e]" /> Story / Cốt Truyện Bé Rắn
              </h3>
              <span className="text-[10px] font-semibold text-[#b85b88] bg-pink-50 px-2 py-0.5 rounded-full">
                🌸 Cốt truyện
              </span>
            </div>
            <div className="text-xs sm:text-[13px] text-[#5e496a] leading-relaxed font-normal whitespace-pre-wrap min-h-[140px] max-h-[280px] sm:max-h-[340px] overflow-y-auto pr-1.5 space-y-2 selection:bg-pink-100">
              {storyText ? (
                <div className="space-y-2">
                  {storyText}
                </div>
              ) : (
                <p className="text-[#9e83a6] italic text-center py-6">
                  Bé rắn này chưa có cốt truyện chi tiết. Hãy liên hệ Admin để cập nhật nhé! ✨
                </p>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS BAR PINNED */}
        <div className="shrink-0 pt-2.5 mt-2 border-t border-purple-100/70 flex flex-wrap items-center justify-between gap-1.5">
          
          {/* Nút Link Bé Rắn */}
          {linkTarget ? (
            <a
              href={linkTarget}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#F4ECFF] to-[#FFEBF8] hover:from-[#ebe0fc] hover:to-[#ffd6f4] text-[#5e4373] font-bold text-xs rounded-xl shadow-2xs border border-purple-100 flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
            >
              <span>{linkText}</span>
              <ExternalLink size={12} className="text-[#8b609e]" />
            </a>
          ) : (
            <div className="text-[10px] text-[#a08ca8] italic">
              Chưa đặt link
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Nút Admin sửa bé rắn */}
            {isAdmin && onEditCharacter && (
              <button
                onClick={() => {
                  onClose();
                  onEditCharacter(character);
                }}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200/80 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Admin: Chỉnh sửa thông tin bé rắn"
              >
                <Edit2 size={12} className="text-amber-600" /> Sửa bé
              </button>
            )}

            {/* Nút Gửi Thư Bí Mật / Feedback */}
            <button
              onClick={() => { onClose(); onOpenFeedback(character); }}
              className="px-3 py-1.5 bg-white hover:bg-purple-50 text-[#644973] text-xs font-semibold rounded-xl border border-purple-100 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <MessageSquare size={12} className="text-[#b85b88]" /> Gửi Thư
            </button>

            {/* Nút Đóng */}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100/80 text-[#7a5d7c] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};

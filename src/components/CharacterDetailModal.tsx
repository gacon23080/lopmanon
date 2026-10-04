import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const {
    isPlaying: isSchoolMusicPlaying,
    toggleMusic: toggleSchoolMusic,
    setCharPlaying,
    setCharModalOpen,
    stopCharMusicSignal,
  } = useMusic();

  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialSignalRef = useRef(stopCharMusicSignal);
  const youtubeId = extractYouTubeId(character.youtubeMusicUrl);

  const sendCharCommand = useCallback((func: string, args: any[] = []) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func,
            args,
          }),
          '*'
        );
      }
    } catch {}
  }, []);

  const triggerCharPlay = useCallback(() => {
    sendCharCommand('unMute', []);
    sendCharCommand('setVolume', [100]);
    sendCharCommand('playVideo', []);
  }, [sendCharCommand]);

  // Khi mở hồ sơ nhân vật có nhạc riêng -> báo cho MusicPlayer tạm dừng nhạc nền trường học
  useEffect(() => {
    if (youtubeId) {
      setCharModalOpen(true);
    } else {
      setCharModalOpen(false);
    }
    return () => {
      setCharModalOpen(false);
      setCharPlaying(false);
    };
  }, [youtubeId, setCharModalOpen, setCharPlaying]);

  // Đồng bộ trạng thái nhạc nhân vật đang phát hay đã tắt
  useEffect(() => {
    if (youtubeId && isPlayingMusic) {
      setCharPlaying(true);
      const t1 = window.setTimeout(triggerCharPlay, 150);
      const t2 = window.setTimeout(triggerCharPlay, 450);
      const t3 = window.setTimeout(triggerCharPlay, 900);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
      };
    } else {
      setCharPlaying(false);
    }
  }, [youtubeId, isPlayingMusic, setCharPlaying, triggerCharPlay]);

  // Chỉ tắt nhạc nhân vật khi người dùng bấm nút tắt nhạc chung LÚC modal đang mở (không kích hoạt nhầm lúc vừa mở modal!)
  useEffect(() => {
    if (stopCharMusicSignal !== initialSignalRef.current) {
      initialSignalRef.current = stopCharMusicSignal;
      setIsPlayingMusic(false);
    }
  }, [stopCharMusicSignal]);

  const toggleCharacterMusic = () => {
    soundManager.playPop();
    setIsPlayingMusic(prev => !prev);
  };

  // Safe close: ngắt hoàn toàn bài hát của nhân vật trước khi đóng
  const handleClose = () => {
    setIsPlayingMusic(false);
    setCharPlaying(false);
    setCharModalOpen(false);
    onClose();
  };

  useEffect(() => {
    soundManager.playSparkle();
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
        onClick={handleClose} 
      />

      {/* Embedded In-App YouTube Audio Player for Character Theme:
          Đặt trong vùng viewport (bottom: 0, right: 0) để trình duyệt luôn cho phép autoplay ngay lập tức!
          Khi bấm Tắt nhạc -> gỡ hoàn toàn khỏi DOM, tắt tiếng 100% tức thì! */}
      {youtubeId && isPlayingMusic && (
        <div 
          aria-hidden="true"
          style={{
            position: 'fixed',
            bottom: '0px',
            right: '0px',
            width: '240px',
            height: '160px',
            opacity: 0.01,
            pointerEvents: 'none',
            zIndex: 1,
            overflow: 'hidden',
          }}
        >
          <iframe
            ref={iframeRef}
            width="240"
            height="160"
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1`}
            title={`Nhạc nền của ${character.name}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            onLoad={triggerCharPlay}
          />
        </div>
      )}

      {/* Main Modal Card */}
      <div className="bg-[#FFFDF9] rounded-3xl p-3.5 sm:p-5 w-full max-w-lg md:max-w-xl my-auto relative z-10 shadow-2xl border border-purple-100 max-h-[82vh] flex flex-col animate-in zoom-in-95">
        
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
            {/* Nút Bật / Tắt nhạc ngay trên thanh tiêu đề Modal */}
            {youtubeId ? (
              <button
                onClick={toggleCharacterMusic}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all shadow-2xs border cursor-pointer flex items-center gap-1 ${
                  isPlayingMusic 
                    ? 'bg-pink-50 border-pink-200 text-[#b85b88] hover:bg-pink-100' 
                    : 'bg-purple-50/70 border-purple-100 text-[#8a7294] hover:bg-purple-100/60'
                }`}
                title={isPlayingMusic ? "Bấm để tắt nhạc của bé ngay lập tức" : "Bấm để bật lại nhạc của bé"}
              >
                {isPlayingMusic ? <Volume2 size={13} className="animate-pulse" /> : <VolumeX size={13} />}
                <span>{isPlayingMusic ? 'Tắt nhạc bé 🎵' : 'Bật nhạc bé'}</span>
              </button>
            ) : (
              <button
                onClick={toggleSchoolMusic}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all shadow-2xs border cursor-pointer flex items-center gap-1 ${
                  isSchoolMusicPlaying 
                    ? 'bg-pink-50 border-pink-200 text-[#b85b88] hover:bg-pink-100' 
                    : 'bg-purple-50/70 border-purple-100 text-[#8a7294] hover:bg-purple-100/60'
                }`}
                title={isSchoolMusicPlaying ? "Bấm để tắt nhạc nền" : "Bấm để bật nhạc nền"}
              >
                {isSchoolMusicPlaying ? <Volume2 size={13} className="animate-pulse" /> : <VolumeX size={13} />}
                <span>{isSchoolMusicPlaying ? 'Tắt nhạc 🎵' : 'Bật nhạc'}</span>
              </button>
            )}

            {/* Close Button */}
            <button 
              onClick={handleClose} 
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
            
            {/* Ảnh đại diện dọc */}
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
                    <span className="text-[9px] font-semibold text-[#8b6b96]">Bé Rắn</span>
                  </div>
                )}

                {character.is18Plus && (
                  <div className="absolute top-1.5 right-1.5 bg-red-400/95 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs flex items-center gap-0.5">
                    <ShieldAlert size={9} /> 18+
                  </div>
                )}
              </div>

              {/* Tags dưới ảnh */}
              <div className="flex flex-wrap gap-1 justify-center mt-1.5 w-full">
                {(character.tags || []).map(t => {
                  const is18 = ['18+', 'r18', 'h+', 'nsfw', '+18'].includes(t.toLowerCase());
                  return (
                    <span 
                      key={t} 
                      className={`text-[9px] font-medium px-1.5 py-0.2 rounded-full border ${
                        is18 
                          ? 'bg-red-50 text-red-600 border-red-200' 
                          : 'bg-[#F5EDFF] text-[#6d4d7a] border-purple-100'
                      }`}
                    >
                      {is18 ? `🔞 ${t}` : t}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 4 Thông số: Tuổi, Ngày sinh, Thích, Ghét */}
            <div className="col-span-8 grid grid-cols-2 gap-1.5">
              {/* Tuổi */}
              <div className="bg-white rounded-xl p-2 border border-purple-100/70 shadow-2xs">
                <div className="text-[9px] font-semibold text-[#8b609e] flex items-center gap-1">
                  <Cake size={11} className="text-pink-400" /> Tuổi
                </div>
                <div className="text-xs font-semibold text-[#5e4373] truncate mt-0.5">
                  {character.age || 'Đang cập nhật'}
                </div>
              </div>

              {/* Ngày sinh */}
              <div className="bg-white rounded-xl p-2 border border-purple-100/70 shadow-2xs">
                <div className="text-[9px] font-semibold text-[#8b609e] flex items-center gap-1">
                  <Calendar size={11} className="text-blue-400" /> Ngày sinh
                </div>
                <div className="text-xs font-semibold text-[#5e4373] truncate mt-0.5">
                  {character.birthday || 'Đang cập nhật'}
                </div>
              </div>

              {/* Sở thích */}
              <div className="bg-white rounded-xl p-2 border border-purple-100/70 shadow-2xs col-span-2 sm:col-span-1">
                <div className="text-[9px] font-semibold text-[#b85b88] flex items-center gap-1">
                  <Heart size={11} className="text-pink-400 fill-pink-400" /> Thích
                </div>
                <div className="text-[11px] font-medium text-[#644973] line-clamp-2 mt-0.5 leading-snug">
                  {character.likes || 'Đang cập nhật'}
                </div>
              </div>

              {/* Điều ghét */}
              <div className="bg-white rounded-xl p-2 border border-purple-100/70 shadow-2xs col-span-2 sm:col-span-1">
                <div className="text-[9px] font-semibold text-rose-500 flex items-center gap-1">
                  <HeartCrack size={11} className="text-rose-400" /> Ghét
                </div>
                <div className="text-[11px] font-medium text-[#644973] line-clamp-2 mt-0.5 leading-snug">
                  {character.dislikes || 'Đang cập nhật'}
                </div>
              </div>

              {/* Giới thiệu ngắn */}
              {character.bio && (
                <div className="col-span-2 bg-purple-50/40 rounded-xl p-2 border border-purple-100/60">
                  <p className="text-[11px] text-[#6d4d7a] italic line-clamp-2 leading-relaxed font-normal">
                    "{character.bio}"
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Cốt truyện (Story / Plot) */}
          <div className="bg-white rounded-2xl p-3 border border-purple-100/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-purple-50 pb-1">
              <h3 className="text-xs font-bold text-[#6d4d7a] flex items-center gap-1.5 uppercase tracking-wide">
                <BookOpen size={13} className="text-[#8b609e]" /> Cốt Truyện & Hồ Sơ Chi Tiết
              </h3>
              {youtubeId && (
                <span className="text-[9px] text-[#b85b88] font-medium flex items-center gap-1">
                  {isPlayingMusic ? '🎵 Đang phát nhạc riêng của bé' : '🔇 Đã tắt nhạc bé'}
                </span>
              )}
            </div>
            <div className="text-xs text-[#5e496a] leading-relaxed max-h-36 sm:max-h-44 overflow-y-auto pr-1 whitespace-pre-wrap font-normal">
              {storyText ? (
                storyText
              ) : (
                <p className="text-[#9e83a6] italic">Bé rắn này chưa có cốt truyện chi tiết. Cô giáo sẽ sớm cập nhật thêm nhé!</p>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR PINNED */}
        <div className="shrink-0 pt-2.5 mt-2.5 border-t border-purple-100/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Gửi Feedback cho bé */}
            <button
              onClick={() => {
                handleClose();
                onOpenFeedback(character);
              }}
              className="px-3 py-1.5 bg-white hover:bg-purple-50 text-[#644973] text-xs font-semibold rounded-xl border border-purple-100 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <MessageSquare size={13} className="text-[#b85b88]" /> Gửi Thư / Feedback
            </button>

            {/* Nút Sửa nhanh cho Admin */}
            {isAdmin && onEditCharacter && (
              <button
                onClick={() => {
                  handleClose();
                  onEditCharacter(character);
                }}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200/80 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Edit2 size={12} /> Sửa Bé
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {linkTarget && (
              <a
                href={linkTarget}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#F3E8FF] to-[#FFE8F7] hover:from-[#e7d6fc] hover:to-[#ffd6f2] text-[#5e4373] font-bold text-xs rounded-xl border border-purple-100 shadow-2xs flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
              >
                <span>{linkText}</span>
                <ExternalLink size={12} className="text-[#8b609e]" />
              </a>
            )}

            <button
              onClick={handleClose}
              className="px-3 py-1.5 bg-purple-50/70 hover:bg-purple-100/70 text-[#7a5d7c] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
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

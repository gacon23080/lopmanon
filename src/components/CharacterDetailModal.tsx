import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, HeartCrack, Cake, Calendar, BookOpen, Volume2, VolumeX, MessageSquare, ExternalLink, ShieldAlert, Edit2 } from 'lucide-react';
import { Character } from '../lib/data';
import { extractYouTubeId } from '../lib/youtube';
import { soundManager } from '../lib/audio';

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
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const youtubeId = extractYouTubeId(character.youtubeMusicUrl);

  const toggleMusic = () => {
    if (iframeRef.current) {
      const message = isPlayingMusic
        ? '{"event":"command","func":"pauseVideo","args":""}'
        : '{"event":"command","func":"playVideo","args":""}';
      iframeRef.current.contentWindow?.postMessage(message, '*');
      setIsPlayingMusic(!isPlayingMusic);
      soundManager.playPop();
    }
  };

  useEffect(() => {
    soundManager.playSparkle();
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [youtubeId]);

  const linkTarget = character.linkUrl || character.googleAiLink;
  const linkText = character.linkLabel || "Mở Link Bé Rắn ✨";
  const storyText = character.story || character.plot || character.bio;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop tối mờ che phủ TOÀN BỘ màn hình, đè lên cả Header và thanh điều hướng */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md" 
        onClick={onClose} 
      />

      {/* Embedded In-App YouTube Audio Player */}
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

      {/* Main Modal Card: Nằm đè lên trên cùng (z-10 bên trong portal z-[99999]), 
          Header và Bottom Bar ghim cố định, không bao giờ bị thanh menu trang web che khuất! */}
      <div className="bg-[#FFFBF5] rounded-3xl p-3.5 sm:p-5 w-full max-w-lg md:max-w-xl my-auto relative z-10 shadow-2xl border-4 border-white max-h-[80vh] flex flex-col animate-in zoom-in-95">
        
        {/* TOP HEADER PINNED (CỐ ĐỊNH Ở ĐỈNH, 100% KHÔNG BỊ TRÔI HOẶC BỊ CHE MẤT) */}
        <div className="shrink-0 flex items-center justify-between gap-2 border-b border-purple-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐍</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black text-[#4f3c66] line-clamp-1">
                  {character.name}
                </h2>
                {character.is18Plus && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs flex items-center gap-0.5 shrink-0">
                    <ShieldAlert size={10} /> 18+
                  </span>
                )}
              </div>
              <p className="text-[10px] text-purple-700/80 font-medium line-clamp-1">
                Hồ sơ chi tiết & Cốt truyện bé rắn 🌸
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick in-app music toggle in header if available */}
            {youtubeId && (
              <button
                onClick={toggleMusic}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-2xs border cursor-pointer flex items-center gap-1 ${
                  isPlayingMusic 
                    ? 'bg-pink-100 border-pink-300 text-pink-700 animate-pulse' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
                title="Bật/Tắt nhạc nền của bé"
              >
                {isPlayingMusic ? <Volume2 size={12} /> : <VolumeX size={12} />}
                <span className="hidden xs:inline">{isPlayingMusic ? 'Nhạc 🎵' : 'Tắt'}</span>
              </button>
            )}

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full p-1.5 shadow-2xs border border-purple-100 cursor-pointer transition-transform hover:scale-105"
              title="Đóng hồ sơ"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MIDDLE CONTENT: CUỘN MƯỢT NẾU DÀI, KÍCH THƯỚC GỌN GÀNG ĐỂ VỪA VẶN MỌI MÀN HÌNH */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
          <div className="grid grid-cols-12 gap-3 items-start">
            
            {/* Ảnh đại diện dọc nhỏ gọn (không choán màn hình) */}
            <div className="col-span-4 flex flex-col items-center">
              <div className="w-full aspect-[3/4] max-h-36 sm:max-h-40 rounded-xl overflow-hidden bg-gradient-to-tr from-[#EDE4FF] to-[#FFE8F7] border-2 border-white shadow-sm relative flex items-center justify-center">
                {character.imageUrl ? (
                  <img 
                    src={character.imageUrl} 
                    alt={character.name} 
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="text-center p-2 text-gray-400">
                    <span className="text-3xl block">🐍</span>
                    <span className="text-[9px] font-bold text-purple-900">Bé Rắn</span>
                  </div>
                )}

                {character.is18Plus && (
                  <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
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
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                        is18 
                          ? 'bg-red-100 text-red-700 border-red-200' 
                          : 'bg-[#EDE4FF] text-purple-900 border-purple-200'
                      }`}
                    >
                      {is18 ? `🔞 ${t}` : t}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 4 Chỉ Số: Tuổi, Ngày Sinh, Thích, Ghét (Đã bỏ Bio theo yêu cầu để nhường không gian cho Story) */}
            <div className="col-span-8 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {/* Tuổi */}
                <div className="bg-white/95 rounded-xl p-2 border border-purple-100 shadow-2xs">
                  <div className="text-[10px] font-black text-purple-600 flex items-center gap-1">
                    <Cake size={11} className="text-pink-500" /> Tuổi
                  </div>
                  <div className="text-xs font-black text-gray-800 truncate mt-0.5">
                    {character.age || 'Đang cập nhật'}
                  </div>
                </div>

                {/* Ngày sinh */}
                <div className="bg-white/95 rounded-xl p-2 border border-purple-100 shadow-2xs">
                  <div className="text-[10px] font-black text-purple-600 flex items-center gap-1">
                    <Calendar size={11} className="text-blue-500" /> Ngày sinh
                  </div>
                  <div className="text-xs font-black text-gray-800 truncate mt-0.5">
                    {character.birthday || 'Đang cập nhật'}
                  </div>
                </div>

                {/* Thích */}
                <div className="bg-white/95 rounded-xl p-2 border border-purple-100 shadow-2xs">
                  <div className="text-[10px] font-black text-pink-600 flex items-center gap-1">
                    <Heart size={11} className="text-pink-500 fill-pink-500" /> Thích
                  </div>
                  <div className="text-[11px] font-semibold text-gray-700 truncate mt-0.5" title={character.likes}>
                    {character.likes || 'Đang cập nhật'}
                  </div>
                </div>

                {/* Ghét */}
                <div className="bg-white/95 rounded-xl p-2 border border-purple-100 shadow-2xs">
                  <div className="text-[10px] font-black text-red-500 flex items-center gap-1">
                    <HeartCrack size={11} className="text-red-400" /> Ghét
                  </div>
                  <div className="text-[11px] font-semibold text-gray-700 truncate mt-0.5" title={character.dislikes}>
                    {character.dislikes || 'Đang cập nhật'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Story / Cốt truyện chi tiết (MỞ RỘNG KHÔNG GIAN, ĐỌC MƯỢT MÀ VÀ RÕ RÀNG) */}
          <div className="bg-white/95 rounded-2xl p-3.5 sm:p-4 border border-purple-100/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-purple-50 pb-1.5">
              <h3 className="text-xs font-black text-[#5e35b1] flex items-center gap-1.5 uppercase tracking-wide">
                <BookOpen size={14} className="text-purple-600" /> Story / Cốt Truyện Bé Rắn
              </h3>
              <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                🌸 Cốt truyện
              </span>
            </div>
            <div className="text-xs sm:text-[13px] text-gray-700 leading-relaxed font-normal whitespace-pre-wrap min-h-[140px] max-h-[280px] sm:max-h-[340px] overflow-y-auto pr-1.5 space-y-2 selection:bg-pink-100">
              {storyText ? (
                <div className="space-y-2">
                  {storyText}
                </div>
              ) : (
                <p className="text-gray-400 italic text-center py-6">
                  Bé rắn này chưa có cốt truyện chi tiết. Hãy liên hệ Admin để cập nhật nhé! ✨
                </p>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS BAR PINNED (LUÔN GHIM CỐ ĐỊNH Ở ĐÁY, ĐẢM BẢO VỪA VÀ HIỆN ĐỦ TẤT CẢ CÁC NÚT) */}
        <div className="shrink-0 pt-2.5 mt-2 border-t border-purple-100 flex flex-wrap items-center justify-between gap-1.5">
          
          {/* Nút Link Bé Rắn (Custom Link do Admin sửa) */}
          {linkTarget ? (
            <a
              href={linkTarget}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#EDE4FF] to-[#FFE8F7] hover:from-[#dfd2fb] hover:to-[#ffd5f3] text-purple-950 font-black text-xs rounded-xl shadow-xs border border-white flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
            >
              <span>{linkText}</span>
              <ExternalLink size={12} className="text-purple-700" />
            </a>
          ) : (
            <div className="text-[10px] text-gray-400 italic">
              Chưa đặt link
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Nút Admin sửa bé rắn trực tiếp từ hồ sơ */}
            {isAdmin && onEditCharacter && (
              <button
                onClick={() => {
                  onClose();
                  onEditCharacter(character);
                }}
                className="px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 text-xs font-bold rounded-xl border border-yellow-200 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Admin: Chỉnh sửa thông tin bé rắn"
              >
                <Edit2 size={12} className="text-yellow-600" /> Sửa bé
              </button>
            )}

            {/* Nút Gửi Thư Bí Mật / Feedback */}
            <button
              onClick={() => { onClose(); onOpenFeedback(character); }}
              className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-900 text-xs font-bold rounded-xl border border-purple-200 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <MessageSquare size={12} className="text-pink-500" /> Gửi Thư
            </button>

            {/* Nút Đóng */}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
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

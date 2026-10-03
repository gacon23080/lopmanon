import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Dices, X, Heart, HeartCrack, Cake, Calendar, BookOpen, ExternalLink, MessageSquare, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { Character } from '../lib/data';
import { extractYouTubeId } from '../lib/youtube';
import { soundManager } from '../lib/audio';

interface RandomHusbandModalProps {
  characters: Character[];
  onClose: () => void;
  onViewPlot: (char: Character) => void;
  onFeedback: (char: Character) => void;
  onGoogleAi: (char: Character) => void;
  onMusic: (char: Character) => void;
}

const FORTUNES = [
  "Bé đang chuẩn bị một bình sữa dâu thơm phức để đợi bạn tan làm về đó~ 🍓🍼",
  "Hôm nay độ tương thích đạt 100%! Bé sẵn sàng quấn quanh cổ tay bạn làm vòng bảo hộ cả ngày. 🐍✨",
  "Bé vừa lén bỏ một cánh hoa tươi vào cặp của bạn kèm lời nhắn: 'Yêu bạn nhất trên đời!'. 🌸",
  "Đang giả vờ ngủ để đợi bạn cúi xuống xoa đầu và thơm nhẹ một cái nè! 😳💕",
  "Hôm nay bé quyết định ngoan ngoãn 100%, bạn bảo gì bé cũng nghe theo luôn! 🎀",
  "Bé vừa chuẩn bị bài hát mới và muốn hát riêng cho một mình bạn nghe đó~ 🎶",
];

export const RandomHusbandModal: React.FC<RandomHusbandModalProps> = ({
  characters,
  onClose,
  onViewPlot,
  onFeedback,
  onGoogleAi,
}) => {
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [compatibility, setCompatibility] = useState(99);
  const [fortune, setFortune] = useState('');
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentYoutubeId = extractYouTubeId(selectedChar?.youtubeMusicUrl);

  const toggleMusic = () => {
    if (iframeRef.current) {
      const message = isPlayingMusic
        ? '{"event":"command","func":"pauseVideo","args":""}'
        : '{"event":"command","func":"playVideo","args":""}';
      iframeRef.current.contentWindow?.postMessage(message, '*');
      setIsPlayingMusic(!isPlayingMusic);
    }
  };

  const rollHusband = () => {
    if (characters.length === 0) return;
    setIsRolling(true);
    setIsPlayingMusic(false);
    soundManager.playSparkle();

    let rollCount = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * characters.length);
      setSelectedChar(characters[randomIdx]);
      rollCount++;
      if (rollCount > 10) {
        clearInterval(interval);
        const finalChar = characters[Math.floor(Math.random() * characters.length)];
        setSelectedChar(finalChar);
        setCompatibility(Math.floor(88 + Math.random() * 12));
        setFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
        setIsRolling(false);
        // Autoplay music in-app if character has music
        if (finalChar.youtubeMusicUrl) {
          setIsPlayingMusic(true);
        }
      }
    }, 100);
  };

  useEffect(() => {
    rollHusband();
  }, []);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose}></div>

      {/* In-app hidden audio iframe for character music (Never opens new tab!) */}
      {currentYoutubeId && (
        <div className="hidden pointer-events-none w-0 h-0 overflow-hidden opacity-0">
          <iframe
            ref={iframeRef}
            width="100"
            height="100"
            src={`https://www.youtube-nocookie.com/embed/${currentYoutubeId}?enablejsapi=1&autoplay=1&loop=1&playlist=${currentYoutubeId}&playsinline=1`}
            title={`Nhạc nền của ${selectedChar?.name}`}
            allow="autoplay"
          />
        </div>
      )}

      <div className="bg-gradient-to-b from-[#FFFBF5] to-[#FFDEF9] rounded-[2.5rem] p-5 sm:p-7 w-full max-w-lg relative z-10 shadow-2xl border-4 border-white text-center transform transition-all animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white/80 rounded-full p-2 shadow-sm cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        <div className="inline-flex items-center gap-1.5 bg-[#DFD1FF] text-purple-900 px-4 py-1.5 rounded-full text-xs font-black mb-2 shadow-sm border border-white">
          <Sparkles size={14} className="text-pink-600" /> BỐC THĂM BÉ CHỒNG HÔM NAY 🐍
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-[#5e35b1] mb-1">
          {isRolling ? 'Đang chọn bé chồng định mệnh...' : 'Bé Chồng Của Bạn Đã Xuất Hiện!'}
        </h3>
        <p className="text-xs text-pink-600 font-medium mb-4">
          🌸 Mỗi ngày một duyên phận ngọt ngào tại Mầm Non Rắn Con 🍼
        </p>

        {selectedChar && (
          <div className="bg-white/95 backdrop-blur rounded-3xl p-4 sm:p-5 border-2 border-pink-100 shadow-md mb-5 relative overflow-hidden text-left space-y-3">
            
            {/* Compatibility Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-950 flex items-center gap-1">
                <span>🐍</span> {selectedChar.name}
              </span>
              <div className="bg-pink-100 text-pink-700 text-xs font-black px-3 py-1 rounded-full border border-pink-200 flex items-center gap-1 shadow-xs">
                <Heart size={13} className="text-red-500 fill-red-500" /> {compatibility}% Tương thích
              </div>
            </div>

            {/* Vertical Photo & Attributes */}
            <div className="grid grid-cols-12 gap-3 items-center">
              
              {/* Vertical Photo */}
              <div className="col-span-4 aspect-[3/4] rounded-2xl bg-gradient-to-tr from-[#DCD2FF] to-[#FFDEF9] p-0.5 shadow-sm overflow-hidden shrink-0 flex items-center justify-center border border-purple-100">
                {selectedChar.imageUrl ? (
                  <img src={selectedChar.imageUrl} alt={selectedChar.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-3xl">🐍</span>
                )}
              </div>

              {/* Attributes (Tuổi, Ngày sinh, Thích, Ghét) */}
              <div className="col-span-8 space-y-1.5 text-xs text-gray-700">
                {(selectedChar.age || selectedChar.birthday) && (
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold text-purple-900">
                    {selectedChar.age && <span className="bg-purple-50 px-2 py-0.5 rounded-md flex items-center gap-1"><Cake size={11} className="text-pink-500" /> {selectedChar.age}</span>}
                    {selectedChar.birthday && <span className="bg-pink-50 px-2 py-0.5 rounded-md flex items-center gap-1"><Calendar size={11} className="text-blue-500" /> {selectedChar.birthday}</span>}
                  </div>
                )}
                {selectedChar.likes && (
                  <div className="text-[11px] line-clamp-1">
                    <span className="font-bold text-pink-600">💖 Thích:</span> {selectedChar.likes}
                  </div>
                )}
                {selectedChar.dislikes && (
                  <div className="text-[11px] line-clamp-1">
                    <span className="font-bold text-red-500">💔 Ghét:</span> {selectedChar.dislikes}
                  </div>
                )}
                <p className="text-[11px] text-gray-500 line-clamp-2 italic pt-0.5">
                  "{selectedChar.bio}"
                </p>
              </div>
            </div>

            {/* In-app Music Status Bar if char has music */}
            {currentYoutubeId && (
              <div className="bg-pink-50/80 rounded-xl p-2 flex items-center justify-between border border-pink-200 text-xs">
                <span className="text-pink-800 font-bold flex items-center gap-1.5 text-[11px]">
                  <span>🎶</span> Nhạc nền của bé đang mở trực tiếp
                </span>
                <button
                  onClick={toggleMusic}
                  className="px-2.5 py-1 bg-white hover:bg-pink-100 text-pink-700 font-black rounded-lg border border-pink-200 text-[10px] cursor-pointer shadow-xs"
                >
                  {isPlayingMusic ? 'Tạm Dừng 🔇' : 'Phát Tiếp 🎵'}
                </button>
              </div>
            )}

            {/* Fortune card */}
            <div className="bg-[#FFF1E3] rounded-2xl p-3 border border-orange-100 text-xs text-orange-950 text-left shadow-inner">
              <span className="font-bold text-pink-600 block mb-0.5">💌 Lời nhắn định mệnh:</span>
              {fortune}
            </div>

            {/* Actions for this character */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button 
                onClick={() => onViewPlot(selectedChar)}
                className="py-2 px-2 rounded-xl bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 text-xs font-black flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
              >
                <BookOpen size={13} className="text-purple-600" /> Hồ Sơ & Story
              </button>

              {/* Custom Link Button (Tên nút do admin sửa) */}
              {(selectedChar.linkUrl || selectedChar.googleAiLink) ? (
                <a
                  href={selectedChar.linkUrl || selectedChar.googleAiLink}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-black flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer truncate"
                  title={selectedChar.linkLabel || 'Mở Link'}
                >
                  <ExternalLink size={12} className="text-blue-600 shrink-0" />
                  <span className="truncate">{selectedChar.linkLabel || 'Mở Link'}</span>
                </a>
              ) : (
                <button 
                  disabled
                  className="py-2 px-2 rounded-xl bg-gray-50 text-gray-400 border border-gray-100 text-xs font-medium opacity-50 cursor-not-allowed"
                >
                  Chưa có link
                </button>
              )}

              <button 
                onClick={() => onFeedback(selectedChar)}
                className="py-2 px-2 rounded-xl bg-[#DFD1FF] hover:bg-[#c4b5fd] text-purple-950 text-xs font-black flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
              >
                <MessageSquare size={13} /> Gửi Thư
              </button>
            </div>

          </div>
        )}

        {/* Re-roll Button */}
        <button
          disabled={isRolling}
          onClick={rollHusband}
          className="w-full bg-[#DFD1FF] hover:bg-[#c4b5fd] text-purple-950 font-black py-3 px-6 rounded-2xl shadow-md border border-white flex items-center justify-center gap-2 text-xs sm:text-sm transition-all hover:scale-[1.02] disabled:opacity-60 cursor-pointer"
        >
          <Dices size={18} className={isRolling ? 'animate-spin' : ''} />
          <span>{isRolling ? 'Đang bốc thăm...' : '🎲 Bốc lại Bé Chồng Khác'}</span>
        </button>
      </div>
    </div>
  );
};

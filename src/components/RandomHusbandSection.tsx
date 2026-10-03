import React, { useState, useRef } from 'react';
import { Dices, Sparkles, Volume2, VolumeX, Cake, Calendar, Heart, HeartCrack, BookOpen, ExternalLink, ShieldAlert, RotateCcw, MessageSquare } from 'lucide-react';
import { Character } from '../lib/data';
import { extractYouTubeId } from '../lib/youtube';
import { soundManager } from '../lib/audio';

interface RandomHusbandSectionProps {
  characters: Character[];
  isAdmin: boolean;
  onOpenCharacterDetail: (char: Character) => void;
  onSendFeedbackToChar: (char: Character) => void;
  onGoToClassroom: () => void;
}

export const RandomHusbandSection: React.FC<RandomHusbandSectionProps> = ({
  characters,
  isAdmin,
  onOpenCharacterDetail,
  onSendFeedbackToChar,
  onGoToClassroom,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedHusband, setSelectedHusband] = useState<Character | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const [history, setHistory] = useState<Character[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Filter pool
  const candidatePool = characters.filter(c => {
    if (selectedTag === 'all') return true;
    if (selectedTag === '18+') return c.is18Plus || (c.tags || []).some(t => ['18+', 'r18', 'h+'].includes(t.toLowerCase()));
    if (selectedTag === 'safe') return !c.is18Plus && !(c.tags || []).some(t => ['18+', 'r18', 'h+'].includes(t.toLowerCase()));
    return (c.tags || []).includes(selectedTag);
  });

  const handleRoll = () => {
    if (candidatePool.length === 0) return;
    setIsRolling(true);
    soundManager.playPop();

    let rollCount = 0;
    const interval = setInterval(() => {
      rollCount++;
      const randomIdx = Math.floor(Math.random() * candidatePool.length);
      setSelectedHusband(candidatePool[randomIdx]);
      if (rollCount > 10) {
        clearInterval(interval);
        const finalHusband = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        setSelectedHusband(finalHusband);
        setIsRolling(false);
        setIsPlayingMusic(true);
        soundManager.playSparkle();

        // Add to roll history
        setHistory(prev => {
          const filtered = prev.filter(c => c.id !== finalHusband.id);
          return [finalHusband, ...filtered].slice(0, 6);
        });
      }
    }, 100);
  };

  const toggleMusic = () => {
    if (iframeRef.current) {
      const message = isPlayingMusic
        ? '{"event":"command","func":"pauseVideo","args":""}'
        : '{"event":"command","func":"playVideo","args":""}';
      iframeRef.current.contentWindow?.postMessage(message, '*');
      setIsPlayingMusic(!isPlayingMusic);
    }
  };

  const youtubeId = selectedHusband ? extractYouTubeId(selectedHusband.youtubeMusicUrl) : null;
  const linkTarget = selectedHusband ? (selectedHusband.linkUrl || selectedHusband.googleAiLink) : '';
  const linkText = selectedHusband ? (selectedHusband.linkLabel || 'Mở Link Bé Rắn ✨') : '';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* In-App YouTube Audio (Không dùng display:none để trình duyệt không đóng băng âm thanh) */}
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
            title={`Nhạc nền của ${selectedHusband?.name}`}
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        </div>
      )}

      {/* Top Banner Header - Harmonious Pastel Purple & Cream Theme */}
      <div className="glass-card rounded-[2.5rem] p-6 md:p-8 text-center relative overflow-hidden border-4 border-white shadow-lg bg-gradient-to-r from-[#EDE4FF]/90 via-[#FFE8F7]/90 to-[#EDE4FF]/90">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/95 text-purple-950 font-extrabold text-xs px-4 py-1.5 rounded-full shadow-xs border border-purple-200">
            <Sparkles size={14} className="text-pink-500 animate-spin" />
            <span>Khu Vực Riêng Biệt: Gacha Lớp Mầm Non</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-[#523f6b] tracking-tight flex items-center justify-center gap-2">
            <span>🎲</span> Bốc Thăm Bé Chồng Hôm Nay <span>🐍</span>
          </h2>
          
          <p className="text-xs md:text-sm text-purple-900/80 font-medium leading-relaxed">
            Mỗi ngày một bé chồng định mệnh! Hãy quay số để tìm xem bé rắn nào sẽ theo bạn về nhà hôm nay nhé~
          </p>

          {/* Filter Pills - Soft Pastel Harmonious Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                selectedTag === 'all'
                  ? 'bg-gradient-to-r from-[#DFD1FF] to-[#FFDEF9] text-purple-950 border-white shadow-sm font-black scale-105'
                  : 'bg-white/80 text-purple-900 border-white/90 hover:bg-white'
              }`}
            >
              🌈 Tất cả bé ({characters.length})
            </button>
            <button
              onClick={() => setSelectedTag('safe')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                selectedTag === 'safe'
                  ? 'bg-gradient-to-r from-[#DFD1FF] to-[#EDE4FF] text-purple-950 border-white shadow-sm font-black scale-105'
                  : 'bg-white/80 text-purple-900 border-white/90 hover:bg-white'
              }`}
            >
              🍼 Bé ngoan trong sáng
            </button>
            <button
              onClick={() => setSelectedTag('18+')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                selectedTag === '18+'
                  ? 'bg-[#FFE8F7] text-pink-700 border-pink-300 shadow-sm font-black scale-105'
                  : 'bg-white/80 text-pink-600 border-pink-100 hover:bg-pink-50'
              }`}
            >
              🔞 Bé 18+ ({characters.filter(c => c.is18Plus).length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Gacha Interaction Area */}
      <div className="max-w-3xl mx-auto">
        {!selectedHusband ? (
          /* Empty / Initial State: Giant Pastel Roll Button */
          <div className="glass-card rounded-[2.5rem] p-10 md:p-14 text-center border-4 border-white shadow-xl space-y-6 bg-[#FFFBF5]">
            <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-tr from-[#DFD1FF] to-[#FFDEF9] p-4 flex items-center justify-center shadow-inner border-2 border-white animate-bounce" style={{ animationDuration: '2.5s' }}>
              <Dices size={64} className="text-purple-700" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#503f69]">Sẵn Sàng Bốc Thăm Chưa Nè?</h3>
              <p className="text-xs text-purple-900/70 max-w-md mx-auto">
                Nhấn vào nút bên dưới để xúc xắc quay số và chọn ngẫu nhiên một bé rắn dễ thương nhất!
              </p>
            </div>

            <button
              onClick={handleRoll}
              disabled={isRolling || candidatePool.length === 0}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#DFD1FF] via-[#EDE4FF] to-[#FFDEF9] hover:from-[#d5c3fc] hover:to-[#ffd2f5] text-purple-950 font-black text-base md:text-lg shadow-lg shadow-purple-200/50 border-2 border-white transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-3 mx-auto"
            >
              <Dices size={24} className={isRolling ? 'animate-spin text-purple-700' : 'text-purple-700'} />
              <span>{isRolling ? 'Đang Lắc Xúc Xắc...' : '🎲 LẮC XÍ NGẦU BỐC THĂM NGAY ✨'}</span>
            </button>
          </div>
        ) : (
          /* Selected Husband Result Display (KHUNG ẢNH DỌC & ĐẦY ĐỦ THÔNG TIN) */
          <div className="glass-card rounded-[2.5rem] p-6 md:p-8 border-4 border-white shadow-2xl relative overflow-hidden bg-[#FFFBF5] space-y-6">
            
            {/* Header Result Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-pink-700 bg-[#FFE8F7] border border-pink-200 px-3 py-1 rounded-full shadow-2xs">
                  🎉 Bé Chồng Định Mệnh Của Bạn
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#493860] mt-1.5 flex items-center gap-2">
                  <span>🐍</span> {selectedHusband.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Roll Again Button */}
                <button
                  onClick={handleRoll}
                  disabled={isRolling}
                  className="px-4 py-2 bg-gradient-to-r from-[#EDE4FF] to-[#FFE8F7] hover:from-[#dfd2fb] hover:to-[#ffd5f3] text-purple-950 font-black text-xs rounded-xl shadow-xs border border-white flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                >
                  <RotateCcw size={14} className={isRolling ? 'animate-spin' : ''} />
                  <span>Bốc Bé Khác 🎲</span>
                </button>

                {/* Music toggle button */}
                {youtubeId && (
                  <button
                    onClick={toggleMusic}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isPlayingMusic ? 'bg-[#FFE8F7] text-pink-700 border-pink-300 animate-pulse' : 'bg-white/80 text-purple-900 border-purple-100'
                    }`}
                    title="Bật/Tắt nhạc nền"
                  >
                    {isPlayingMusic ? <Volume2 size={14} className="text-pink-600" /> : <VolumeX size={14} className="text-gray-400" />}
                    <span className="hidden sm:inline">{isPlayingMusic ? 'Nhạc nền 🎶' : 'Đã tắt nhạc'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Character Card Body: Vertical Portrait Photo + Full Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* KHUNG ẢNH DỌC (VERTICAL 3:4 RATIO) */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-[260px] md:max-w-none aspect-[3/4] rounded-[2rem] overflow-hidden bg-gradient-to-tr from-[#EDE4FF] to-[#FFE8F7] border-4 border-white shadow-lg relative flex items-center justify-center">
                  {selectedHusband.imageUrl ? (
                    <img
                      src={selectedHusband.imageUrl}
                      alt={selectedHusband.name}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="text-center p-4 text-gray-400">
                      <span className="text-5xl block mb-2">🐍</span>
                      <span className="text-xs font-bold text-purple-900">Mầm Non Rắn Con</span>
                    </div>
                  )}

                  {selectedHusband.is18Plus && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <ShieldAlert size={12} /> 18+
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  {(selectedHusband.tags || []).map(t => (
                    <span
                      key={t}
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EDE4FF] text-purple-950 border border-purple-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Character Attributes & Story */}
              <div className="md:col-span-7 space-y-4">
                
                {/* 4 Attributes: Tuổi, Ngày sinh, Thích, Ghét */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white/95 rounded-2xl p-3 border border-purple-100 shadow-xs">
                    <div className="text-[11px] font-black text-purple-600 flex items-center gap-1">
                      <Cake size={13} className="text-pink-500" /> Tuổi
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-gray-800">
                      {selectedHusband.age || 'Đang cập nhật'}
                    </div>
                  </div>

                  <div className="bg-white/95 rounded-2xl p-3 border border-purple-100 shadow-xs">
                    <div className="text-[11px] font-black text-purple-600 flex items-center gap-1">
                      <Calendar size={13} className="text-blue-500" /> Ngày sinh
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-gray-800">
                      {selectedHusband.birthday || 'Đang cập nhật'}
                    </div>
                  </div>

                  <div className="bg-white/95 rounded-2xl p-3 border border-purple-100 shadow-xs col-span-2 sm:col-span-1">
                    <div className="text-[11px] font-black text-pink-600 flex items-center gap-1">
                      <Heart size={13} className="text-pink-500 fill-pink-500" /> Thích
                    </div>
                    <div className="text-xs font-semibold text-gray-700 line-clamp-2">
                      {selectedHusband.likes || 'Đang cập nhật'}
                    </div>
                  </div>

                  <div className="bg-white/95 rounded-2xl p-3 border border-purple-100 shadow-xs col-span-2 sm:col-span-1">
                    <div className="text-[11px] font-black text-red-500 flex items-center gap-1">
                      <HeartCrack size={13} className="text-red-400" /> Ghét
                    </div>
                    <div className="text-xs font-semibold text-gray-700 line-clamp-2">
                      {selectedHusband.dislikes || 'Đang cập nhật'}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {selectedHusband.bio && (
                  <div className="bg-[#FFFBF5] rounded-2xl p-3 border border-orange-100 shadow-inner">
                    <p className="text-xs font-medium text-gray-700 italic">
                      “{selectedHusband.bio}”
                    </p>
                  </div>
                )}

                {/* Story */}
                <div className="bg-white/95 rounded-2xl p-3.5 border border-purple-100 shadow-xs space-y-1">
                  <h4 className="text-xs font-black text-purple-900 flex items-center gap-1.5 uppercase">
                    <BookOpen size={13} className="text-purple-600" /> Story / Cốt Truyện
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap pr-1">
                    {selectedHusband.story || selectedHusband.plot || 'Chưa có cốt truyện chi tiết.'}
                  </p>
                </div>

                {/* Actions: Custom Link & Detail Modal */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  {linkTarget && (
                    <a
                      href={linkTarget}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 bg-gradient-to-r from-[#DFD1FF] to-[#FFDEF9] hover:from-[#d5c3fc] hover:to-[#ffd2f5] text-purple-950 font-black text-xs rounded-xl shadow-md border border-white flex items-center gap-1.5 transition-transform hover:scale-102 cursor-pointer"
                    >
                      <span>{linkText}</span>
                      <ExternalLink size={13} className="text-purple-700" />
                    </a>
                  )}

                  <button
                    onClick={() => onOpenCharacterDetail(selectedHusband)}
                    className="px-4 py-2.5 bg-white hover:bg-[#FFE8F7] text-purple-950 text-xs font-bold rounded-xl border border-purple-200 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    📖 Xem Hồ Sơ Chi Tiết
                  </button>

                  <button
                    onClick={() => onSendFeedbackToChar(selectedHusband)}
                    className="px-4 py-2.5 bg-white hover:bg-[#FFE8F7] text-pink-700 text-xs font-bold rounded-xl border border-pink-200 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <MessageSquare size={13} className="text-pink-500" /> Gửi Thư Cho Bé
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}
      </div>

      {/* History of Drawn Husbands */}
      {history.length > 0 && (
        <div className="glass-card rounded-[2.5rem] p-6 max-w-4xl mx-auto border-2 border-white shadow-md bg-white/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>🕒</span> Lịch Sử Bốc Thăm Trong Phiên Này ({history.length})
            </h4>
            <button
              onClick={() => setHistory([])}
              className="text-[11px] text-purple-700 hover:text-purple-900 font-bold cursor-pointer"
            >
              Xóa lịch sử
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {history.map(char => (
              <div
                key={char.id}
                onClick={() => {
                  setSelectedHusband(char);
                  setIsPlayingMusic(true);
                }}
                className={`p-2 rounded-2xl border transition-all cursor-pointer text-center group hover:scale-105 ${
                  selectedHusband?.id === char.id ? 'bg-[#FFE8F7] border-pink-300 shadow-sm' : 'bg-white/90 border-purple-100 hover:bg-[#EDE4FF]/50'
                }`}
              >
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-purple-50 mb-1.5 relative shadow-inner">
                  {char.imageUrl ? (
                    <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🐍</span>
                  )}
                </div>
                <div className="text-[11px] font-bold text-gray-800 truncate" title={char.name}>
                  {char.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

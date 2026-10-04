import React, { useState, useRef, useEffect } from 'react';
import { Dices, Sparkles, Volume2, VolumeX, Cake, Calendar, Heart, HeartCrack, BookOpen, ExternalLink, ShieldAlert, RotateCcw, MessageSquare } from 'lucide-react';
import { Character } from '../lib/data';
import { extractYouTubeId } from '../lib/youtube';
import { soundManager } from '../lib/audio';
import { useMusic } from './MusicPlayer';

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
  const { setCharPlaying, pauseMusic, stopCharMusicSignal } = useMusic();
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedHusband, setSelectedHusband] = useState<Character | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const [history, setHistory] = useState<Character[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialSignalRef = useRef(stopCharMusicSignal);

  const youtubeId = selectedHusband ? extractYouTubeId(selectedHusband.youtubeMusicUrl) : null;

  const triggerHusbandMusic = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        ['unMute', 'playVideo'].forEach((func) => {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func, args: [] }),
            '*'
          );
        });
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
          '*'
        );
      }
    } catch {}
  };

  // Khi nhạc nhân vật trong phần bốc thăm phát -> Tự động dừng nhạc nền lớp học
  useEffect(() => {
    if (youtubeId && isPlayingMusic && !isRolling) {
      setCharPlaying(true);
      const t1 = window.setTimeout(triggerHusbandMusic, 150);
      const t2 = window.setTimeout(triggerHusbandMusic, 450);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    } else {
      setCharPlaying(false);
    }
    return () => {
      setCharPlaying(false);
    };
  }, [youtubeId, isPlayingMusic, isRolling, setCharPlaying]);

  // Lắng nghe tín hiệu tắt nhạc từ thanh Header / Floating Bar (chỉ khi thay đổi thực sự)
  useEffect(() => {
    if (stopCharMusicSignal !== initialSignalRef.current) {
      initialSignalRef.current = stopCharMusicSignal;
      setIsPlayingMusic(false);
      setCharPlaying(false);
    }
  }, [stopCharMusicSignal, setCharPlaying]);

  // Tự động đồng bộ dữ liệu mới nhất khi Admin sửa hoặc xóa nhân vật / tag
  useEffect(() => {
    if (selectedHusband && !isRolling) {
      const latest = characters.find(c => c.id === selectedHusband.id);
      if (latest) {
        setSelectedHusband(latest);
      } else if (characters.length > 0) {
        setSelectedHusband(null);
      }
    }
    setHistory(prev =>
      prev
        .map(item => characters.find(c => c.id === item.id))
        .filter((item): item is Character => Boolean(item))
    );
  }, [characters, isRolling]);

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

  const sendIframeCommand = (func: string, args: any[] = []) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: func,
            args: args
          }),
          "*"
        );
      }
    } catch (e) {
      console.warn("Error sending command to husband music iframe:", e);
    }
  };

  const toggleMusic = () => {
    soundManager.playPop();
    const nextState = !isPlayingMusic;
    setIsPlayingMusic(nextState);
    setCharPlaying(nextState && !!youtubeId);

    if (!nextState) {
      // Khi chủ động bấm tắt nhạc bé -> giữ yên tĩnh hoàn toàn, không tự bật nhạc nền đè lên
      pauseMusic();
    }
  };

  const linkTarget = selectedHusband ? (selectedHusband.linkUrl || selectedHusband.googleAiLink) : '';
  const linkText = selectedHusband ? (selectedHusband.linkLabel || 'Mở Link Bé Rắn ✨') : '';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* In-App YouTube Audio */}
      {youtubeId && isPlayingMusic && !isRolling && (
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
            zIndex: 35,
            overflow: 'hidden',
          }}
        >
          <iframe
            ref={iframeRef}
            width="240"
            height="160"
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1`}
            title={`Nhạc nền của ${selectedHusband?.name}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            onLoad={triggerHusbandMusic}
          />
        </div>
      )}

      {/* Top Banner Header */}
      <div className="glass-card rounded-[2.2rem] p-6 md:p-8 text-center relative overflow-hidden border border-purple-100 shadow-sm bg-gradient-to-r from-[#F4ECFF]/90 via-[#FFEBF8]/90 to-[#F4ECFF]/90">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/90 text-[#644973] font-bold text-xs px-4 py-1.5 rounded-full shadow-2xs border border-purple-100">
            <Sparkles size={13} className="text-pink-400 animate-spin" />
            <span>Khu Vực Riêng Biệt: Gacha Lớp Mầm Non</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-[#5e4373] tracking-normal flex items-center justify-center gap-2">
            <span>🎲</span> Bốc Thăm Bé Chồng Hôm Nay <span>🐍</span>
          </h2>
          
          <p className="text-xs md:text-sm text-[#7e608a] font-normal leading-relaxed">
            Mỗi ngày một bé chồng định mệnh! Hãy quay số để tìm xem bé rắn nào sẽ theo bạn về nhà hôm nay nhé~
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                selectedTag === 'all'
                  ? 'bg-gradient-to-r from-[#EAE0FF] to-[#FFDFF7] text-[#5e4373] border-white shadow-xs font-bold scale-102'
                  : 'bg-white/80 text-[#7a5d84] border-purple-100 hover:bg-white'
              }`}
            >
              🌈 Tất cả bé ({characters.length})
            </button>
            <button
              onClick={() => setSelectedTag('safe')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                selectedTag === 'safe'
                  ? 'bg-gradient-to-r from-[#EAE0FF] to-[#F4ECFF] text-[#5e4373] border-white shadow-xs font-bold scale-102'
                  : 'bg-white/80 text-[#7a5d84] border-purple-100 hover:bg-white'
              }`}
            >
              🍼 Bé ngoan trong sáng
            </button>
            <button
              onClick={() => setSelectedTag('18+')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                selectedTag === '18+'
                  ? 'bg-[#FFEBF8] text-[#b85b88] border-pink-200 shadow-xs font-bold scale-102'
                  : 'bg-white/80 text-[#c26d97] border-pink-100 hover:bg-pink-50'
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
          /* Initial State */
          <div className="glass-card rounded-[2.2rem] p-10 md:p-12 text-center border border-purple-100 shadow-md space-y-6 bg-[#FFFDF9]">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-[#F4ECFF] to-[#FFEBF8] p-4 flex items-center justify-center shadow-inner border border-purple-100 animate-bounce" style={{ animationDuration: '2.5s' }}>
              <Dices size={54} className="text-[#8b609e]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-bold text-[#5e4373]">Sẵn Sàng Bốc Thăm Chưa Nè?</h3>
              <p className="text-xs text-[#7e608a] max-w-md mx-auto font-normal">
                Nhấn vào nút bên dưới để xúc xắc quay số và chọn ngẫu nhiên một bé rắn dễ thương nhất!
              </p>
            </div>

            <button
              onClick={handleRoll}
              disabled={isRolling || candidatePool.length === 0}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#EAE0FF] via-[#F4ECFF] to-[#FFEBF8] hover:from-[#e0d3fc] hover:to-[#ffd4f4] text-[#5e4373] font-bold text-base shadow-sm border border-purple-100 transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 mx-auto"
            >
              <Dices size={20} className={isRolling ? 'animate-spin text-[#8b609e]' : 'text-[#8b609e]'} />
              <span>{isRolling ? 'Đang Lắc Xúc Xắc...' : '🎲 LẮC XÍ NGẦU BỐC THĂM NGAY ✨'}</span>
            </button>
          </div>
        ) : (
          /* Selected Husband Result Display */
          <div className="glass-card rounded-[2.2rem] p-6 md:p-8 border border-purple-100 shadow-lg relative overflow-hidden bg-[#FFFDF9] space-y-6">
            
            {/* Header Result Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100/70 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#b85b88] bg-[#FFEBF8] border border-pink-150 px-3 py-1 rounded-full shadow-2xs">
                  🎉 Bé Chồng Định Mệnh Của Bạn
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#5e4373] mt-1.5 flex items-center gap-2">
                  <span>🐍</span> {selectedHusband.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Roll Again Button */}
                <button
                  onClick={handleRoll}
                  disabled={isRolling}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F4ECFF] to-[#FFEBF8] hover:from-[#ebe0fc] hover:to-[#ffd6f4] text-[#5e4373] font-semibold text-xs border border-purple-100 shadow-2xs flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                >
                  <RotateCcw size={13} className={isRolling ? 'animate-spin' : ''} />
                  <span>Bốc lại</span>
                </button>

                {/* Music Toggle */}
                {youtubeId && (
                  <button
                    onClick={toggleMusic}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-2xs cursor-pointer flex items-center gap-1.5 ${
                      isPlayingMusic 
                        ? 'bg-pink-50 border-pink-200 text-[#b85b88] animate-pulse' 
                        : 'bg-purple-50/50 border-purple-100 text-[#8a7294]'
                    }`}
                    title="Bật/Tắt nhạc nền của bé (nhạc nền lớp học sẽ tạm nhường tiếng)"
                  >
                    {isPlayingMusic ? <Volume2 size={13} /> : <VolumeX size={13} />}
                    <span>{isPlayingMusic ? 'Nhạc bé 🎵' : 'Tắt'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Profile Detail Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Photo Area */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-full aspect-[3/4] max-h-72 sm:max-h-80 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#F4ECFF] to-[#FFEBF8] border border-purple-100 shadow-xs relative flex items-center justify-center">
                  {selectedHusband.imageUrl ? (
                    <img
                      src={selectedHusband.imageUrl}
                      alt={selectedHusband.name}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="text-center p-4 text-purple-300">
                      <span className="text-5xl block">🐍</span>
                      <span className="text-xs font-semibold text-[#7e608a]">Bé Rắn</span>
                    </div>
                  )}

                  {selectedHusband.is18Plus && (
                    <div className="absolute top-2 right-2 bg-red-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                      <ShieldAlert size={11} /> 18+
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-3 w-full">
                  {(selectedHusband.tags || []).map(t => {
                    const is18 = ['18+', 'r18', 'h+', 'nsfw', '+18'].includes(t.toLowerCase());
                    return (
                      <span
                        key={t}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
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

              {/* Info Stats & Story */}
              <div className="md:col-span-7 space-y-4">
                {/* 4 Chỉ Số: Tuổi, Ngày Sinh, Thích, Ghét */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl p-2.5 border border-purple-100/70 shadow-2xs">
                    <div className="text-[10px] font-semibold text-[#8b609e] flex items-center gap-1">
                      <Cake size={12} className="text-pink-400" /> Tuổi
                    </div>
                    <div className="text-xs font-semibold text-[#5e4373] truncate mt-0.5">
                      {selectedHusband.age || 'Đang cập nhật'}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-2.5 border border-purple-100/70 shadow-2xs">
                    <div className="text-[10px] font-semibold text-[#8b609e] flex items-center gap-1">
                      <Calendar size={12} className="text-blue-400" /> Ngày sinh
                    </div>
                    <div className="text-xs font-semibold text-[#5e4373] truncate mt-0.5">
                      {selectedHusband.birthday || 'Đang cập nhật'}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-2.5 border border-purple-100/70 shadow-2xs">
                    <div className="text-[10px] font-semibold text-[#b85b88] flex items-center gap-1">
                      <Heart size={12} className="text-pink-400 fill-pink-400" /> Thích
                    </div>
                    <div className="text-xs font-medium text-[#644973] truncate mt-0.5">
                      {selectedHusband.likes || 'Đang cập nhật'}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-2.5 border border-purple-100/70 shadow-2xs">
                    <div className="text-[10px] font-semibold text-rose-500 flex items-center gap-1">
                      <HeartCrack size={12} className="text-rose-400" /> Ghét
                    </div>
                    <div className="text-xs font-medium text-[#644973] truncate mt-0.5">
                      {selectedHusband.dislikes || 'Đang cập nhật'}
                    </div>
                  </div>
                </div>

                {/* Story / Cốt truyện */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-purple-100/80 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-[#6d4d7a] flex items-center gap-1.5 uppercase tracking-wide border-b border-purple-50 pb-1.5">
                    <BookOpen size={13} className="text-[#8b609e]" /> Cốt Truyện & Hồ Sơ
                  </h4>
                  <div className="text-xs text-[#5e496a] leading-relaxed max-h-40 overflow-y-auto pr-1 whitespace-pre-wrap font-normal">
                    {selectedHusband.story || selectedHusband.plot || selectedHusband.bio || (
                      <p className="text-[#9e83a6] italic">Bé rắn này chưa có cốt truyện chi tiết.</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {linkTarget && (
                    <a
                      href={linkTarget}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-gradient-to-r from-[#F4ECFF] to-[#FFEBF8] hover:from-[#ebe0fc] hover:to-[#ffd6f4] text-[#5e4373] font-bold text-xs rounded-xl border border-purple-100 shadow-2xs flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                    >
                      <span>{linkText}</span>
                      <ExternalLink size={12} className="text-[#8b609e]" />
                    </a>
                  )}

                  <button
                    onClick={() => onSendFeedbackToChar(selectedHusband)}
                    className="px-3.5 py-2 bg-white hover:bg-purple-50 text-[#644973] text-xs font-semibold rounded-xl border border-purple-100 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <MessageSquare size={13} className="text-[#b85b88]" /> Gửi Thư Cho Bé
                  </button>

                  <button
                    onClick={() => onOpenCharacterDetail(selectedHusband)}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100/80 text-[#7a5d7c] text-xs font-semibold rounded-xl cursor-pointer transition-colors ml-auto"
                  >
                    Xem Chi Tiết 🌸
                  </button>
                </div>

              </div>

            </div>

            {/* History of recent rolled husbands */}
            {history.length > 1 && (
              <div className="pt-4 border-t border-purple-100/70 space-y-2">
                <span className="text-[11px] font-bold text-[#7e608a] flex items-center gap-1">
                  <Sparkles size={12} className="text-pink-400" /> Các bé đã bốc thăm gần đây:
                </span>
                <div className="flex flex-wrap gap-2">
                  {history.map(h => (
                    <button
                      key={h.id}
                      onClick={() => {
                        setSelectedHusband(h);
                        setIsPlayingMusic(true);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                        selectedHusband.id === h.id
                          ? 'bg-gradient-to-r from-[#EAE0FF] to-[#FFDFF7] text-[#5e4373] border-white shadow-2xs font-bold'
                          : 'bg-white hover:bg-purple-50 text-[#6d4d7a] border-purple-100 shadow-2xs'
                      }`}
                    >
                      <span>🐍</span>
                      <span>{h.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
};

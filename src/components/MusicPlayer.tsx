import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, VolumeX, Music, Edit2, X, Check } from 'lucide-react';
import { extractYouTubeId } from '../lib/youtube';
import { getSchoolMusic, updateSchoolMusic, SchoolMusicConfig, DEFAULT_SCHOOL_MUSIC } from '../lib/data';
import { soundManager } from '../lib/audio';

interface MusicContextType {
  isPlaying: boolean;
  musicConfig: SchoolMusicConfig;
  toggleMusic: () => void;
  playMusic: () => void;
  pauseMusic: () => void;
  openEditModal: () => void;
  setCharPlaying: (playing: boolean) => void;
  isCharPlaying: boolean;
  stopCharMusicSignal: number;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error('useMusic must be used within MusicProvider');
  }
  return ctx;
};

interface MusicProviderProps {
  children: React.ReactNode;
  autoPlayTrigger?: boolean;
  isAdmin?: boolean;
  isPausedByModal?: boolean;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ 
  children,
  autoPlayTrigger = false,
  isAdmin = false,
  isPausedByModal = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCharPlaying, setIsCharPlaying] = useState(false);
  const [stopCharMusicSignal, setStopCharMusicSignal] = useState(0);
  const [hasBeenStoppedOnce, setHasBeenStoppedOnce] = useState(false);
  const [musicConfig, setMusicConfig] = useState<SchoolMusicConfig>(DEFAULT_SCHOOL_MUSIC);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasAutoPlayedRef = useRef(false);
  const playTimersRef = useRef<number[]>([]);

  const clearPlayTimers = useCallback(() => {
    playTimersRef.current.forEach((id) => window.clearTimeout(id));
    playTimersRef.current = [];
  }, []);

  // Load saved school background music from Firestore / localStorage
  useEffect(() => {
    const loadMusic = async () => {
      try {
        const config = await getSchoolMusic();
        setMusicConfig(config);
        setEditUrl(config.url);
        setEditTitle(config.title);
      } catch (e) {
        console.warn("Could not load school music:", e);
      }
    };
    loadMusic();
  }, []);

  const videoId = extractYouTubeId(musicConfig.url) || "3Ozo7tejr00";

  // Send command to YouTube iframe via standard postMessage
  const sendCommand = useCallback((func: string, args: any[] = []) => {
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
      console.warn("Error sending command to YouTube:", e);
    }
  }, []);

  // Phát nhạc ngay tức thì
  const playMusic = useCallback(() => {
    clearPlayTimers();
    setIsPlaying(true);
    if (!isCharPlaying && !isPausedByModal) {
      sendCommand("unMute", []);
      sendCommand("setVolume", [100]);
      sendCommand("playVideo", []);

      const t1 = window.setTimeout(() => {
        sendCommand("unMute", []);
        sendCommand("setVolume", [100]);
        sendCommand("playVideo", []);
      }, 120);

      const t2 = window.setTimeout(() => {
        sendCommand("unMute", []);
        sendCommand("setVolume", [100]);
        sendCommand("playVideo", []);
      }, 380);

      playTimersRef.current = [t1, t2];
    }
  }, [clearPlayTimers, isCharPlaying, isPausedByModal, sendCommand]);

  // Tắt / tạm dừng nhạc nền hoàn toàn (gỡ iframe + gửi lệnh pause)
  const pauseMusic = useCallback(() => {
    clearPlayTimers();
    setIsPlaying(false);
    setHasBeenStoppedOnce(true);
    sendCommand("pauseVideo", []);
    sendCommand("stopVideo", []);
    sendCommand("mute", []);
  }, [clearPlayTimers, sendCommand]);

  // Chuyển đổi trạng thái Bật / Tắt (Nếu nhạc nhân vật đang kêu thì tắt luôn cả nhạc nhân vật!)
  const toggleMusic = useCallback(() => {
    soundManager.playPop();
    if (isCharPlaying) {
      // Nếu nhạc nhân vật đang phát -> bấm nút tắt nhạc sẽ tắt ngay nhạc nhân vật & giữ im lặng
      setStopCharMusicSignal((prev) => prev + 1);
      setIsCharPlaying(false);
      pauseMusic();
      return;
    }
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }, [isCharPlaying, isPlaying, playMusic, pauseMusic]);

  // Chỉ tự động phát ĐÚNG 1 LẦN khi bấm "Vào lớp thui" (autoPlayTrigger chuyển sang true)
  useEffect(() => {
    if (autoPlayTrigger && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      playMusic();
    } else if (!autoPlayTrigger && hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = false;
      pauseMusic();
    }
  }, [autoPlayTrigger, playMusic, pauseMusic]);

  // Khi nhạc của nhân vật (char) bật hoặc modal video mở -> Đánh dấu đã dừng để gỡ iframe nền ngay lập tức
  useEffect(() => {
    if (isCharPlaying || isPausedByModal) {
      clearPlayTimers();
      setHasBeenStoppedOnce(true);
      sendCommand("pauseVideo", []);
      sendCommand("mute", []);
    } else if (isPlaying && autoPlayTrigger) {
      sendCommand("unMute", []);
      sendCommand("setVolume", [100]);
      sendCommand("playVideo", []);
    }
  }, [isCharPlaying, isPausedByModal, isPlaying, autoPlayTrigger, clearPlayTimers, sendCommand]);

  const setCharPlaying = useCallback((playing: boolean) => {
    setIsCharPlaying(playing);
  }, []);

  const handleSaveMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUrl.trim()) return;

    setIsSaving(true);
    try {
      const newConfig: SchoolMusicConfig = {
        url: editUrl.trim(),
        title: editTitle.trim() || 'Nhạc nền Mầm Non Rắn Con 🎵',
      };
      await updateSchoolMusic(newConfig);
      setMusicConfig(newConfig);
      setShowEditModal(false);
      soundManager.playSparkle();
      
      // Tự động phát bài hát mới vừa đổi
      setHasBeenStoppedOnce(true);
      setIsPlaying(true);
    } catch (e) {
      console.error("Failed to save school music:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Logic hiển thị Iframe Nhạc Nền:
  // 1. Khi còn ở cổng trường (!autoPlayTrigger): Nạp sẵn ngầm (Pre-warm) với autoplay=0
  // 2. Khi đã vào lớp (autoPlayTrigger === true):
  //    - Chỉ giữ iframe khi (isPlaying && !isCharPlaying && !isPausedByModal)
  //    - Ngay khi người dùng bấm "Tắt nhạc" (!isPlaying) hoặc nhạc nhân vật bật (isCharPlaying):
  //      Gỡ hoàn toàn iframe khỏi DOM -> Nhạc tắt NGAY LẬP TỨC 100% không thể kêu thêm dù chỉ 1 giây!
  const shouldRenderBgIframe = Boolean(videoId) && (
    !autoPlayTrigger || (isPlaying && !isCharPlaying && !isPausedByModal)
  );

  // Nếu đã từng tắt hoặc tạm dừng rồi bật lại trong lớp -> dùng autoplay=1 để phát ngay khi mount lại
  const iframeAutoplayParam = (autoPlayTrigger && hasBeenStoppedOnce) ? 1 : 0;

  return (
    <MusicContext.Provider value={{
      isPlaying,
      musicConfig,
      toggleMusic,
      playMusic,
      pauseMusic,
      openEditModal: () => setShowEditModal(true),
      setCharPlaying,
      isCharPlaying,
      stopCharMusicSignal
    }}>
      {shouldRenderBgIframe && (
        <div 
          aria-hidden="true"
          style={{
            position: 'fixed',
            bottom: '0px',
            right: '0px',
            width: '240px',
            height: '160px',
            opacity: 0.001,
            pointerEvents: 'none',
            zIndex: -50,
            overflow: 'hidden',
          }}
        >
          <iframe
            ref={iframeRef}
            width="240"
            height="160"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${iframeAutoplayParam}&controls=0&loop=1&playlist=${videoId}&playsinline=1`}
            title={musicConfig.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            onLoad={() => {
              if (autoPlayTrigger && isPlaying && !isCharPlaying && !isPausedByModal) {
                sendCommand("unMute", []);
                sendCommand("setVolume", [100]);
                sendCommand("playVideo", []);
              }
            }}
          />
        </div>
      )}

      {children}

      {/* Admin Music Customizer Modal - Wrapped in Portal */}
      {showEditModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/65 backdrop-blur-md animate-fade-in" 
            onClick={() => setShowEditModal(false)} 
          />
          <div className="bg-[#FFFBF5] rounded-3xl p-6 sm:p-7 max-w-md w-full relative z-10 shadow-2xl border border-purple-100 space-y-4 animate-in zoom-in-95 my-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white text-gray-400 hover:text-gray-600 border border-purple-100 cursor-pointer shadow-2xs"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2.5 text-purple-900">
              <div className="p-2.5 rounded-2xl bg-[#F3E8FF] text-[#8b5cf6] shadow-2xs">
                <Music size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#6d4d7a]">Cài Đặt Nhạc Nền Trang Web</h3>
                <p className="text-[11px] text-[#9b7b99] font-medium">Dán bất kỳ bài hát YouTube nào bạn thích</p>
              </div>
            </div>

            <form onSubmit={handleSaveMusic} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#6b4c73] mb-1">
                  Tên bài hát / Lời đề tặng:
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ví dụ: Nhạc thiếu nhi vui nhộn 🎵"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium text-[#5a3f69]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b4c73] mb-1">
                  Đường dẫn YouTube (URL):
                </label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium text-[#5a3f69]"
                  required
                />
                <p className="text-[10px] text-[#9b7b99] mt-1">
                  Hỗ trợ link YouTube thường, link rút gọn youtu.be, hoặc YouTube Shorts.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-purple-100 text-[#7a5d7c] font-semibold text-xs hover:bg-purple-50/50 cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#b388eb] to-[#f7a8b8] hover:opacity-95 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-opacity"
                >
                  {isSaving ? (
                    <span>Đang lưu...</span>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Lưu bài hát</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Mini Music Bar in Classroom UI */}
      {autoPlayTrigger && (
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-purple-100 shadow-md animate-fade-in text-xs">
          <button
            onClick={toggleMusic}
            title={(isPlaying || isCharPlaying) ? "Bấm để tắt nhạc ngay" : "Bấm để bật nhạc nền"}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 font-semibold ${
              (isPlaying || isCharPlaying)
                ? 'bg-pink-100 text-[#b85b88] hover:bg-pink-200' 
                : 'bg-purple-50 text-[#7a5d84] hover:bg-purple-100'
            }`}
          >
            {(isPlaying || isCharPlaying) ? <Volume2 size={15} className="animate-pulse" /> : <VolumeX size={15} />}
            <span className="text-[11px]">
              {(isPlaying || isCharPlaying) ? 'Tắt nhạc' : 'Bật nhạc'}
            </span>
          </button>

          <div className="hidden xs:flex items-center gap-1.5 max-w-[120px] sm:max-w-[160px] overflow-hidden pr-1">
            <span className="text-[#644973] font-medium truncate text-[11px]">
              {isCharPlaying ? '🎵 Nhạc của bé' : (isPlaying ? musicConfig.title : 'Đã tắt nhạc')}
            </span>
            {(isPlaying || isCharPlaying) && (
              <span className="flex gap-0.5 items-center shrink-0">
                <span className="w-1 h-2 bg-pink-400 rounded-full animate-pulse"></span>
                <span className="w-1 h-3.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </span>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowEditModal(true)}
              title="Đổi bài hát nền khác"
              className="p-1 rounded-full text-[#8b5cf6] hover:bg-purple-100/50 transition-colors ml-0.5 cursor-pointer"
            >
              <Edit2 size={13} />
            </button>
          )}
        </div>
      )}
    </MusicContext.Provider>
  );
};

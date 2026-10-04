import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, VolumeX, Music, Edit2, X, Check } from 'lucide-react';
import { extractYouTubeId } from '../lib/youtube';
import { getSchoolMusic, updateSchoolMusic, subscribeToSchoolMusic, SchoolMusicConfig, DEFAULT_SCHOOL_MUSIC } from '../lib/data';
import { soundManager } from '../lib/audio';

interface MusicContextType {
  isPlaying: boolean;
  musicConfig: SchoolMusicConfig;
  toggleMusic: () => void;
  playMusic: () => void;
  pauseMusic: () => void;
  openEditModal: () => void;
  setCharPlaying: (playing: boolean) => void;
  setCharModalOpen: (open: boolean) => void;
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

// Danh sách các YouTube ID của bài "Đến Đây Bên Anh - Dangrangto" (sử dụng trực tiếp file âm thanh gốc chất lượng cao để phát tức thì 0ms, không bao giờ bị YouTube chặn nhúng)
const DEN_DAY_BEN_ANH_IDS = new Set([
  '3Ozo7tejr00',
  'iwAUr6kR2GU',
  'bTzglgODJKE',
  'JpyFnhyhyI0',
  '6WGMyJb1YrY',
  'nJ3B7xZ1eLo',
  'lyr7zbk8NUA',
]);

export const MusicProvider: React.FC<MusicProviderProps> = ({ 
  children,
  autoPlayTrigger = false,
  isAdmin = false,
  isPausedByModal = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCharPlaying, setIsCharPlaying] = useState(false);
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [stopCharMusicSignal, setStopCharMusicSignal] = useState(0);
  const [ytEmbedError, setYtEmbedError] = useState(false);
  const [musicConfig, setMusicConfig] = useState<SchoolMusicConfig>(() => {
    try {
      const cached = localStorage.getItem('schoolMusic');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.url) return { ...DEFAULT_SCHOOL_MUSIC, ...parsed };
      }
    } catch {}
    return DEFAULT_SCHOOL_MUSIC;
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUrl, setEditUrl] = useState(musicConfig.url);
  const [editTitle, setEditTitle] = useState(musicConfig.title);
  const [isSaving, setIsSaving] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
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
        setMusicConfig((prev) => (prev.url === config.url && prev.title === config.title ? prev : config));
        setEditUrl(config.url);
        setEditTitle(config.title);
      } catch (e) {
        console.warn("Could not load school music:", e);
      }
    };
    loadMusic();
    const unsub = subscribeToSchoolMusic((liveConfig) => {
      setMusicConfig((prev) => (prev.url === liveConfig.url && prev.title === liveConfig.title ? prev : liveConfig));
      setEditUrl(liveConfig.url);
      setEditTitle(liveConfig.title);
      setYtEmbedError(false);
    });
    return () => unsub();
  }, []);

  const videoId = extractYouTubeId(musicConfig.url) || "3Ozo7tejr00";
  const isDefaultSong = !videoId || DEN_DAY_BEN_ANH_IDS.has(videoId) || ytEmbedError;

  const isBgSuppressed = isCharPlaying || isCharModalOpen || isPausedByModal;
  const shouldPlayBg = autoPlayTrigger && isPlaying && !isBgSuppressed;

  // Send command to YouTube iframe via standard postMessage (with listening handshake)
  const sendCommand = useCallback((func: string, args: any[] = []) => {
    try {
      const win = iframeRef.current?.contentWindow;
      if (win) {
        win.postMessage(
          JSON.stringify({
            event: "listening",
            id: 1,
            channel: "widget"
          }),
          "*"
        );
        win.postMessage(
          JSON.stringify({
            event: "command",
            func: func,
            args: args,
            id: 1,
            channel: "widget"
          }),
          "*"
        );
      }
    } catch (e) {
      console.warn("Error sending command to YouTube:", e);
    }
  }, []);

  const triggerBgPlay = useCallback(() => {
    sendCommand("unMute", []);
    sendCommand("setVolume", [100]);
    sendCommand("playVideo", []);
  }, [sendCommand]);

  // Listen for YouTube embed errors (e.g. Error 150 copyright block on custom MVs)
  useEffect(() => {
    if (isDefaultSong || !shouldPlayBg) return;
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        if (data && data.event === 'onError') {
          setYtEmbedError(true);
        }
      } catch {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isDefaultSong, shouldPlayBg]);

  // Phát nhạc ngay tức thì (gọi trực tiếp trong sự kiện click "Vào lớp thui" để trình duyệt mở khóa 100% ở 0ms)
  const playMusic = useCallback(() => {
    setIsPlaying(true);
    if (isDefaultSong && audioRef.current && !isBgSuppressed) {
      try {
        audioRef.current.volume = 0.85;
        audioRef.current.muted = false;
        const p = audioRef.current.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch {}
    }
  }, [isDefaultSong, isBgSuppressed]);

  // Tắt nhạc nền hoàn toàn ngay lập tức
  const pauseMusic = useCallback(() => {
    clearPlayTimers();
    setIsPlaying(false);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
    }
  }, [clearPlayTimers]);

  // Chuyển đổi trạng thái Bật / Tắt khi người truy cập bấm nút trong lớp
  const toggleMusic = useCallback(() => {
    soundManager.playPop();
    if (isCharPlaying) {
      // Nếu nhạc nhân vật đang phát -> tắt ngay nhạc nhân vật
      setStopCharMusicSignal((prev) => prev + 1);
      setIsCharPlaying(false);
      return;
    }
    setIsPlaying((prev) => {
      const next = !prev;
      if (isDefaultSong && audioRef.current) {
        try {
          if (next && !isBgSuppressed) {
            audioRef.current.volume = 0.85;
            audioRef.current.muted = false;
            const p = audioRef.current.play();
            if (p && typeof p.catch === 'function') {
              p.catch(() => {});
            }
          } else {
            audioRef.current.pause();
          }
        } catch {}
      }
      return next;
    });
  }, [isCharPlaying, isDefaultSong, isBgSuppressed]);

  // Tự động phát ĐÚNG 1 LẦN ngay khi ấn "Vào lớp thui" (autoPlayTrigger chuyển sang true)
  useEffect(() => {
    if (autoPlayTrigger && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      setIsPlaying(true);
    } else if (!autoPlayTrigger && hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = false;
      setIsPlaying(false);
      clearPlayTimers();
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
    }
  }, [autoPlayTrigger, clearPlayTimers]);

  // Đồng bộ trạng thái phát / tạm dừng của HTML5 Audio và YouTube Iframe theo shouldPlayBg
  useEffect(() => {
    if (shouldPlayBg) {
      if (isDefaultSong) {
        clearPlayTimers();
        if (audioRef.current) {
          audioRef.current.volume = 0.85;
          audioRef.current.muted = false;
          if (audioRef.current.paused) {
            const p = audioRef.current.play();
            if (p && typeof p.catch === 'function') {
              p.catch(() => {});
            }
          }
        }
      } else {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        const t1 = window.setTimeout(triggerBgPlay, 150);
        const t2 = window.setTimeout(triggerBgPlay, 450);
        const t3 = window.setTimeout(triggerBgPlay, 900);
        playTimersRef.current = [t1, t2, t3];
        return () => {
          window.clearTimeout(t1);
          window.clearTimeout(t2);
          window.clearTimeout(t3);
        };
      }
    } else {
      clearPlayTimers();
      if (audioRef.current && !audioRef.current.paused) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    }
  }, [shouldPlayBg, isDefaultSong, videoId, triggerBgPlay, clearPlayTimers]);

  const setCharPlaying = useCallback((playing: boolean) => {
    setIsCharPlaying(playing);
  }, []);

  const setCharModalOpen = useCallback((open: boolean) => {
    setIsCharModalOpen(open);
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
      setYtEmbedError(false);
      setMusicConfig(newConfig);
      setShowEditModal(false);
      soundManager.playSparkle();
      setIsPlaying(true);
    } catch (e) {
      console.error("Failed to save school music:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MusicContext.Provider value={{
      isPlaying,
      musicConfig,
      toggleMusic,
      playMusic,
      pauseMusic,
      openEditModal: () => setShowEditModal(true),
      setCharPlaying,
      setCharModalOpen,
      isCharPlaying,
      stopCharMusicSignal
    }}>
      {/* Native HTML5 Audio Player cho nhạc nền "Đến Đây Bên Anh - Dangrangto":
          Phát tức thì ở 0ms ngay khi bấm "Vào lớp thui", bật/tắt 100% nhạy trên mọi trình duyệt */}
      <audio
        ref={audioRef}
        src="/den-day-ben-anh.m4a"
        loop
        preload="auto"
        playsInline
        className="hidden"
      />

      {/* YouTube Iframe Player khi Admin đổi sang bài hát YouTube khác */}
      {shouldPlayBg && !isDefaultSong && typeof document !== 'undefined' && createPortal(
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
            key={videoId}
            ref={iframeRef}
            width="240"
            height="160"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=0&loop=1&playlist=${videoId}&playsinline=1`}
            title={musicConfig.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            onLoad={triggerBgPlay}
          />
        </div>,
        document.body
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
        </div>,
        document.body
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

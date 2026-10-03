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
  openEditModal: () => void;
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
  autoPlayTrigger,
  isAdmin = false,
  isPausedByModal = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicConfig, setMusicConfig] = useState<SchoolMusicConfig>(DEFAULT_SCHOOL_MUSIC);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Function to send command to YouTube iframe safely
  const sendIframeCommand = useCallback((func: string, args: any = "") => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func, args }),
          "*"
        );
      }
    } catch (e) {
      console.warn("Error communicating with YouTube player:", e);
    }
  }, []);

  // Send play command with retries to overcome YouTube iframe initialization delay
  const triggerPlay = useCallback(() => {
    sendIframeCommand("unMute");
    sendIframeCommand("setVolume", [100]);
    sendIframeCommand("playVideo");
    
    // Retries in case YouTube iframe API was still parsing
    const t1 = setTimeout(() => {
      sendIframeCommand("unMute");
      sendIframeCommand("playVideo");
    }, 400);

    const t2 = setTimeout(() => {
      sendIframeCommand("unMute");
      sendIframeCommand("playVideo");
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [sendIframeCommand]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
    if (isPlaying && !isPausedByModal) {
      triggerPlay();
    }
  };

  // Autoplay trigger khi bấm từ cổng trường vào lớp
  useEffect(() => {
    if (autoPlayTrigger) {
      setIsPlaying(true);
      triggerPlay();
    }
  }, [autoPlayTrigger, triggerPlay]);

  // Tạm dừng khi mở modal nhân vật có nhạc riêng
  useEffect(() => {
    if (isPausedByModal && isPlaying) {
      sendIframeCommand("pauseVideo");
    } else if (!isPausedByModal && isPlaying) {
      triggerPlay();
    }
  }, [isPausedByModal, isPlaying, sendIframeCommand, triggerPlay]);

  // Đồng bộ trạng thái isPlaying
  useEffect(() => {
    if (isPlaying && !isPausedByModal) {
      triggerPlay();
    } else if (!isPlaying) {
      sendIframeCommand("pauseVideo");
    }
  }, [isPlaying, isPausedByModal, triggerPlay, sendIframeCommand]);

  const toggleMusic = () => {
    soundManager.playPop();
    const next = !isPlaying;
    setIsPlaying(next);
    if (next) {
      triggerPlay();
    } else {
      sendIframeCommand("pauseVideo");
    }
  };

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
      setIsPlaying(true);
      setTimeout(() => triggerPlay(), 500);
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
      openEditModal: () => setShowEditModal(true)
    }}>
      {/* 
        Persistent YouTube Audio Player Container:
        - Luôn luôn giữ iframe trong DOM với kích thước chuẩn 320x240 để YouTube Player khởi tạo đầy đủ JS API.
        - Tọa độ off-screen (-9999px) và opacity cực nhỏ (0.001) để trình duyệt không đóng băng luồng âm thanh.
        - Hỗ trợ đầy đủ tương tác trực tiếp, unMute, auto-replay và postMessage.
      */}
      {videoId && (
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
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&loop=1&playlist=${videoId}&playsinline=1`}
            title={musicConfig.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            onLoad={handleIframeLoad}
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
          <div className="bg-[#FFFBF5] rounded-3xl p-6 sm:p-7 max-w-md w-full relative z-10 shadow-2xl border-4 border-white space-y-4 animate-in zoom-in-95 my-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white text-gray-400 hover:text-gray-600 border border-purple-100 cursor-pointer shadow-2xs"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2.5 text-purple-900">
              <div className="p-2.5 rounded-2xl bg-[#EDE4FF] text-purple-700 shadow-2xs">
                <Music size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#5e35b1]">Cài Đặt Nhạc Nền Trang Web</h3>
                <p className="text-[11px] text-gray-500 font-medium">Admin có thể dán bất kỳ bài hát YouTube nào bạn thích</p>
              </div>
            </div>

            <form onSubmit={handleSaveMusic} className="space-y-3.5 text-left pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  🎵 Link YouTube bài hát *
                </label>
                <input
                  type="text"
                  required
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=3Ozo7tejr00"
                  className="w-full bg-white border border-purple-200 focus:border-purple-400 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  🏷️ Tên bài hát hiển thị trên nút phát
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="VD: Đến Đây Bên Anh - Dangrangto 🎵"
                  className="w-full bg-white border border-purple-200 focus:border-purple-400 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none shadow-2xs"
                />
              </div>

              {/* Gợi ý bài hát nhanh */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-purple-900">Gợi ý bài hát hay:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditUrl("https://www.youtube.com/watch?v=3Ozo7tejr00");
                      setEditTitle("Đến Đây Bên Anh - Dangrangto 🎵");
                    }}
                    className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-200 cursor-pointer font-bold transition-colors"
                  >
                    🎵 Đến Đây Bên Anh (Official)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditUrl("https://www.youtube.com/watch?v=nJ3B7xZ1eLo");
                      setEditTitle("Đến Đây Bên Anh - Visualizer 🍂");
                    }}
                    className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-200 cursor-pointer font-bold transition-colors"
                  >
                    🍂 Đến Đây Bên Anh (Visualizer)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditUrl("https://www.youtube.com/watch?v=E27ET_lINRo");
                      setEditTitle("Thế Giới Của Anh - Dangrangto 🌸");
                    }}
                    className="text-[10px] bg-pink-50 hover:bg-pink-100 text-pink-900 px-2.5 py-1 rounded-lg border border-pink-200 cursor-pointer font-bold transition-colors"
                  >
                    🌸 Thế Giới Của Anh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditUrl("https://www.youtube.com/watch?v=5qap5aO4i9A");
                      setEditTitle("Lofi Chill Radio Beats ☕");
                    }}
                    className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer font-bold transition-colors"
                  >
                    ☕ Lofi Chill Radio
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#DFD1FF] to-[#FFDEF9] text-purple-950 font-black text-xs shadow-md border border-white hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Check size={14} className="text-purple-700" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu & Phát Ngay ✨'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </MusicContext.Provider>
  );
};

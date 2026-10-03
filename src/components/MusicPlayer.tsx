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
  const [musicConfig, setMusicConfig] = useState<SchoolMusicConfig>(DEFAULT_SCHOOL_MUSIC);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    setIsPlaying(true);
    sendCommand("unMute", []);
    sendCommand("setVolume", [100]);
    sendCommand("playVideo", []);

    // Gửi tiếp viện nhanh chóng để đảm bảo bắt nhịp ngay tức khắc
    setTimeout(() => {
      sendCommand("unMute", []);
      sendCommand("setVolume", [100]);
      sendCommand("playVideo", []);
    }, 100);

    setTimeout(() => {
      sendCommand("unMute", []);
      sendCommand("playVideo", []);
    }, 350);

    setTimeout(() => {
      sendCommand("unMute", []);
      sendCommand("playVideo", []);
    }, 700);
  }, [sendCommand]);

  // Tạm dừng nhạc
  const pauseMusic = useCallback(() => {
    setIsPlaying(false);
    sendCommand("pauseVideo", []);
  }, [sendCommand]);

  // Chuyển đổi trạng thái Bật / Tắt
  const toggleMusic = useCallback(() => {
    soundManager.playPop();
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }, [isPlaying, playMusic, pauseMusic]);

  // Tự động phát khi bấm "Vào lớp thui"
  useEffect(() => {
    if (autoPlayTrigger && !isPausedByModal) {
      playMusic();
    } else if (!autoPlayTrigger && isPlaying) {
      pauseMusic();
    }
  }, [autoPlayTrigger, isPausedByModal, playMusic, pauseMusic]);

  // Xử lý tạm dừng khi mở modal nhân vật có bài hát riêng
  useEffect(() => {
    if (isPausedByModal) {
      sendCommand("pauseVideo", []);
    } else if (!isPausedByModal && isPlaying) {
      sendCommand("playVideo", []);
    }
  }, [isPausedByModal, isPlaying, sendCommand]);

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
      setTimeout(() => {
        sendCommand("unMute", []);
        sendCommand("setVolume", [100]);
        sendCommand("playVideo", []);
      }, 300);
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
      openEditModal: () => setShowEditModal(true)
    }}>
      {/* 
        Single Stable Pre-Warmed YouTube Audio Player Iframe:
        - Luôn được nạp sẵn ngầm (Pre-warmed) ở chế độ autoplay=0 (không phát tiếng ở cổng trường)
        - Khi bấm "Vào lớp thui ✨": Nhạc phát NGAY LẬP TỨC 0ms vì iframe đã tải sẵn tài nguyên!
      */}
      {videoId && (
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
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&controls=0&loop=1&playlist=${videoId}&playsinline=1`}
            title={musicConfig.title}
            allow="autoplay; encrypted-media; picture-in-picture"
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

            <form onSubmit={handleSaveMusic} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tên bài hát / Lời đề tặng:
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ví dụ: Nhạc thiếu nhi vui nhộn 🎵"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Đường dẫn YouTube (URL):
                </label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-gray-800"
                  required
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  Hỗ trợ link YouTube thường, link rút gọn youtu.be, hoặc YouTube Shorts.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border-2 border-purple-200 shadow-lg animate-fade-in text-xs">
          <button
            onClick={toggleMusic}
            title={isPlaying ? "Tạm dừng nhạc" : "Bật nhạc nền"}
            className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
              isPlaying 
                ? 'bg-pink-100 text-pink-600 hover:bg-pink-200 animate-pulse' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <div className="flex items-center gap-1.5 max-w-[120px] sm:max-w-[180px] overflow-hidden">
            <span className="text-purple-900 font-bold truncate text-[11px] sm:text-xs">
              {musicConfig.title}
            </span>
            {isPlaying && (
              <span className="flex gap-0.5 items-center">
                <span className="w-1 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                <span className="w-1 h-3.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </span>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowEditModal(true)}
              title="Đổi bài hát nền khác"
              className="p-1 rounded-full text-purple-600 hover:bg-purple-100 transition-colors ml-0.5 cursor-pointer"
            >
              <Edit2 size={13} />
            </button>
          )}
        </div>
      )}
    </MusicContext.Provider>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { soundManager } from '../lib/audio';
import { useMusic } from './MusicPlayer';
import shinChanPlaygroundBg from '../assets/images/empty_pastel_purple_kindergarten_school_1791023502965.jpg';

interface SchoolGateProps {
  onEnterSchool: () => void;
  studentCount?: number;
}

export const SchoolGate: React.FC<SchoolGateProps> = ({ onEnterSchool }) => {
  const { playMusic } = useMusic();
  const [showBellFrame, setShowBellFrame] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const hasFinishedRef = useRef(false);

  // Bắt đầu chuỗi chuông 6.0 giây
  const startBell = useCallback(async () => {
    if (hasFinishedRef.current) return;

    // Mở khóa âm thanh
    await soundManager.unlockAudio();

    const played = await soundManager.playSchoolBell(() => {
      hasFinishedRef.current = true;
      setIsRinging(false);
      setShowBellFrame(true);
    });

    if (played) {
      setIsRinging(true);
      setNeedsInteraction(false);
    } else {
      // Trình duyệt chặn autoplay, cần người dùng chạm vào màn hình
      setNeedsInteraction(true);
      setIsRinging(false);
    }
  }, []);

  useEffect(() => {
    // 1. Thử tự động phát chuông ngay khi vừa mở web
    startBell();

    // 2. Lắng nghe tương tác đầu tiên nếu trình duyệt chặn autoplay
    const handleFirstGesture = async () => {
      if (!hasFinishedRef.current && !soundManager.isBellPlaying) {
        await startBell();
      }
    };

    window.addEventListener('pointerdown', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [startBell]);

  const handleEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 1. Dập tắt triệt để toàn bộ tiếng chuông ngay tức khắc (0ms)
    soundManager.stopAllSounds();
    
    // 2. Mở nhạc nền lớp học YouTube
    playMusic();
    soundManager.playPop();
    
    // 3. Bước vào lớp học
    onEnterSchool();
  };

  const handleManualRing = (e: React.MouseEvent) => {
    e.stopPropagation();
    startBell();
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none flex flex-col justify-center items-center p-4 bg-[#2d1b47] cursor-pointer"
      onClick={() => {
        if (needsInteraction && !hasFinishedRef.current) {
          startBell();
        }
      }}
    >
      {/* 🏫 Nền phong cảnh trường mầm non màu tím pastel yên bình */}
      <img
        src={shinChanPlaygroundBg}
        alt="Toàn cảnh trường mầm non nhỏ màu tím pastel phong cách Shin-chan yên bình"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* 🌸 Hiệu ứng cánh hoa anh đào rơi nhẹ nhàng tự nhiên */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-pink-300/85 animate-sakura-fall"
            style={{
              top: `-10%`,
              left: `${(i * 7.5) % 100}%`,
              fontSize: `${13 + (i % 3) * 5}px`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${5 + (i % 4) * 2}s`,
            }}
          >
            🌸
          </div>
        ))}
      </div>

      {/* 🔔 1. Trạng thái Đang Rung Chuông (Chuẩn 6.0 giây) */}
      {isRinging && !showBellFrame && (
        <div className="relative z-20 flex flex-col items-center gap-3 animate-fade-in pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-[0_12px_32px_rgba(130,90,200,0.35)] border-3 border-purple-200">
            <span className="text-5xl animate-bell-ring block">🔔</span>
          </div>

          <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full border border-purple-200 text-[#513c6b] font-black text-xs sm:text-sm shadow-md flex items-center gap-2.5">
            <span className="animate-spin text-pink-500">✨</span>
            <span>Đang reo chuông vào lớp... Reng reng reng~</span>
            <div className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-3 bg-purple-400 rounded-full animate-pulse"></span>
              <span className="w-1 h-4 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 2. Trạng thái Chờ Người Dùng Chạm (Khi trình duyệt chặn Autoplay) */}
      {needsInteraction && !isRinging && !showBellFrame && (
        <div 
          onClick={handleManualRing}
          className="relative z-20 flex flex-col items-center gap-4 animate-bounce-in cursor-pointer max-w-xs text-center"
        >
          <div className="w-24 h-24 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-[0_16px_36px_rgba(130,90,200,0.4)] border-4 border-pink-200 hover:scale-110 active:scale-95 transition-all">
            <span className="text-5xl animate-bounce block">🔔</span>
          </div>

          <div className="bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-2xl border-2 border-purple-200 text-[#513c6b] shadow-lg space-y-1">
            <div className="font-black text-base text-pink-600 flex items-center justify-center gap-1.5">
              <span>🌸</span>
              <span>Chạm để reo chuông</span>
              <span>🌸</span>
            </div>
            <p className="text-xs text-purple-900 font-bold">
              Chạm nhẹ bất kỳ đâu để bắt đầu nghe chuông vào lớp nhé!
            </p>
          </div>
        </div>
      )}

      {/* 🔔 3. Khung Thông Báo Vào Lớp: Hiện NGAY LẬP TỨC khi hết đúng 6.0s chuông */}
      {showBellFrame && (
        <div className="relative z-20 w-full max-w-sm mx-auto animate-bounce-in">
          <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-7 shadow-[0_16px_40px_rgba(130,90,200,0.35)] border-4 border-white text-center space-y-4">
            
            {/* Quả chuông báo giờ vào lớp */}
            <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#EDE4FF] via-[#FFE8F7] to-[#FFFBF5] flex items-center justify-center shadow-inner border-2 border-purple-200">
              <span className="text-4xl animate-bell-ring block select-none">🔔</span>
              <span className="absolute -top-1 -right-1 text-xl animate-pulse">✨</span>
              <span className="absolute -bottom-1 -left-1 text-sm animate-bounce">🎀</span>
            </div>

            {/* Thông báo chuông reo xong */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#513c6b] tracking-tight">
                Reng Reng Reng! 🌸
              </h2>
              <p className="text-xs sm:text-sm font-bold text-pink-600">
                Chuông trường đã reo hết rồi, mau vào lớp thui nè!
              </p>
            </div>

            {/* Nút Vào Lớp Thui */}
            <div className="pt-1">
              <button
                onClick={handleEnter}
                className="w-full group relative py-3.5 px-6 bg-gradient-to-r from-[#EDE4FF] via-[#FFE8F7] to-[#EDE4FF] hover:from-[#e0d0fc] hover:to-[#ffd1f3] text-purple-950 font-black text-base sm:text-lg rounded-2xl shadow-md border-2 border-white/90 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span className="text-2xl animate-bounce">🎒</span>
                <span className="tracking-wide text-purple-950 font-black drop-shadow-sm">
                  Vào lớp thui ✨
                </span>
                <span className="text-lg group-hover:translate-x-1 transition-transform">
                  🌸
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏷️ Tên trường học ở góc trên */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-purple-200 shadow-sm pointer-events-none">
        <span className="text-lg">🏫</span>
        <span className="text-xs sm:text-sm font-black text-[#513c6b]">
          Trường Mầm Non Rắn Con 🌸
        </span>
      </div>
    </div>
  );
};

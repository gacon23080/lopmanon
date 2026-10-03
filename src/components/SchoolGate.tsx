import React, { useState, useEffect } from 'react';
import { soundManager } from '../lib/audio';
import shinChanPlaygroundBg from '../assets/images/empty_pastel_purple_kindergarten_school_1791023502965.jpg';

interface SchoolGateProps {
  onEnterSchool: () => void;
  studentCount?: number;
}

export const SchoolGate: React.FC<SchoolGateProps> = ({ onEnterSchool }) => {
  const [showBellFrame, setShowBellFrame] = useState(false);

  useEffect(() => {
    // Tự động reo chuông trường báo giờ vào lớp
    soundManager.playSchoolBell();

    // Sau khi tiếng chuông reo (~3.2s) thì mới hiện khung chuông reo
    const timer = setTimeout(() => {
      setShowBellFrame(true);
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    // Bấm nút thì vào thẳng lớp học luôn, không phát chuông nữa
    soundManager.playPop();
    onEnterSchool();
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden select-none flex flex-col justify-center items-center p-4 bg-[#2d1b47]">
      
      {/* 🏫 Nền phong cảnh trường mầm non màu tím pastel yên bình (Chỉ có trường, không có học sinh) */}
      <img
        src={shinChanPlaygroundBg}
        alt="Toàn cảnh trường mầm non nhỏ màu tím pastel phong cách Shin-chan yên bình"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* 🌸 Hiệu ứng cánh hoa anh đào rơi nhẹ nhàng tự nhiên */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-pink-300/85 animate-sakura-fall"
            style={{
              top: `-10%`,
              left: `${(i * 8.5) % 100}%`,
              fontSize: `${13 + (i % 3) * 5}px`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${6 + (i % 4) * 2}s`,
            }}
          >
            🌸
          </div>
        ))}
      </div>

      {/* 🔔 Khung Chuông Reo: Xuất hiện sau khi chuông kêu xong, kèm nút "Vào lớp thui" */}
      {showBellFrame && (
        <div className="relative z-20 w-full max-w-sm mx-auto animate-bounce-in">
          <div className="bg-white/92 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-7 shadow-[0_16px_40px_rgba(130,90,200,0.35)] border-4 border-white/95 text-center space-y-4">
            
            {/* Quả chuông lắc lư báo giờ vào lớp */}
            <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#EDE4FF] via-[#FFE8F7] to-[#FFFBF5] flex items-center justify-center shadow-inner border-2 border-purple-200">
              <span className="text-4xl animate-bell-ring block select-none">🔔</span>
              <span className="absolute -top-1 -right-1 text-xl animate-pulse">✨</span>
              <span className="absolute -bottom-1 -left-1 text-sm animate-bounce">🎀</span>
            </div>

            {/* Thông báo chuông reo */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#513c6b] tracking-tight">
                Reng Reng Reng! 🌸
              </h2>
              <p className="text-xs sm:text-sm font-bold text-pink-600">
                Chuông trường đã reo báo giờ vào lớp rồi nè!
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

      {/* CSS Keyframe Animation cho chuông lắc và hiệu ứng */}
      <style>{`
        @keyframes bellRing {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(18deg); }
          30% { transform: rotate(-18deg); }
          45% { transform: rotate(12deg); }
          60% { transform: rotate(-12deg); }
          75% { transform: rotate(6deg); }
          90% { transform: rotate(-3deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-bell-ring {
          animation: bellRing 1.8s ease-in-out infinite;
          transform-origin: top center;
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          70% {
            opacity: 1;
            transform: scale(1.03) translateY(-4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-bounce-in {
          animation: bounceIn 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes sakuraFall {
          0% {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 0;
          }
          15% { opacity: 0.85; }
          85% { opacity: 0.85; }
          100% {
            transform: translate3d(100px, 110vh, 0) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-sakura-fall {
          animation: sakuraFall linear infinite;
        }
      `}</style>
    </div>
  );
};

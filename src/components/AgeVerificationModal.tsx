import React from 'react';
import { AlertTriangle, ShieldCheck, HeartCrack, X } from 'lucide-react';
import { soundManager } from '../lib/audio';

interface AgeVerificationModalProps {
  characterName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
  characterName,
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = () => {
    soundManager.playSparkle();
    onConfirm();
  };

  const handleCancel = () => {
    soundManager.playPop();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={handleCancel}></div>
      
      <div className="bg-[#FFF1E3] rounded-[2.5rem] p-6 md:p-8 w-full max-w-md relative z-10 shadow-2xl border-4 border-[#FFDEF9] text-center transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={handleCancel} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-sm"
        >
          <X size={18} />
        </button>

        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4 border-2 border-red-200 shadow-inner">
          <span className="text-4xl">🔞</span>
        </div>

        <div className="inline-block bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full border border-red-200 mb-2">
          CẢNH BÁO NỘI DUNG 18+
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Xác minh độ tuổi của bạn
        </h3>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Bé rắn <span className="font-bold text-pink-600">{characterName}</span> có chứa yếu tố trưởng thành / tình cảm sâu sắc (18+). Bạn đã đủ 18 tuổi để bước vào thế giới này chưa? 🙈✨
        </p>

        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <ShieldCheck size={20} />
            <span>🌸 Tôi đã đủ 18 tuổi (Xác nhận)</span>
          </button>

          <button
            onClick={handleCancel}
            className="w-full bg-white hover:bg-gray-50 text-gray-600 font-semibold py-3 px-6 rounded-2xl border border-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <HeartCrack size={16} className="text-pink-400" />
            <span>Chưa đâu, quay lại lớp mầm non 🍼</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mt-4">
          Xác nhận sẽ được ghi nhớ trong phiên duyệt web của bạn.
        </p>
      </div>
    </div>
  );
};

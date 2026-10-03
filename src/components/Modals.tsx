import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Trash2, Heart, Sparkles, BookOpen, Star, Copy, Check } from 'lucide-react';
import { addFeedback, getFeedbacks, deleteFeedback, Feedback } from '../lib/data';
import { soundManager } from '../lib/audio';

// --- Plot Modal ---
interface PlotModalProps {
  title: string;
  plot: string;
  onClose: () => void;
}

export const PlotModal: React.FC<PlotModalProps> = ({ title, plot, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(plot || '');
    setCopied(true);
    soundManager.playPop();
    setTimeout(() => setCopied(false), 2000);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-[#FFF1E3] rounded-3xl p-5 md:p-7 w-full max-w-xl my-auto relative z-10 shadow-2xl border-4 border-white max-h-[82vh] flex flex-col animate-in fade-in zoom-in-95">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-orange-400 hover:text-orange-600 bg-white rounded-full p-2 shadow-sm"
        >
          <X size={18} />
        </button>

        <div className="flex items-center justify-between pr-10 mb-4">
          <h2 className="text-xl md:text-2xl font-black text-orange-950 flex items-center gap-2">
            <span className="text-2xl">📖</span> Cốt truyện: {title}
          </h2>
        </div>

        <div className="bg-white/85 p-6 rounded-2xl text-gray-700 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto border border-orange-100 shadow-inner text-sm md:text-base">
          {plot || "Chưa có nội dung cốt truyện chi tiết cho bé rắn này..."}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-white hover:bg-orange-50 text-orange-900 text-xs font-bold rounded-xl border border-orange-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            <span>{copied ? 'Đã sao chép plot!' : 'Sao chép nội dung'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#DFD1FF] hover:bg-[#c4b5fd] text-purple-950 text-xs font-bold rounded-xl border border-white shadow-sm"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Submit Feedback / Sticky Note Modal ---
interface SubmitFeedbackModalProps {
  characterId: string;
  characterName: string;
  onClose: () => void;
}

export const SubmitFeedbackModal: React.FC<SubmitFeedbackModalProps> = ({ characterId, characterName, onClose }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await addFeedback({ characterId, content: content.trim() });
      soundManager.playSparkle();
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-gradient-to-br from-[#DCD2FF] via-[#FFDEF9] to-[#FFF1E3] rounded-3xl p-1 w-full max-w-lg my-auto relative z-10 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="bg-white rounded-[1.4rem] p-5 md:p-7 max-h-[82vh] overflow-y-auto">
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2 shadow-sm"
          >
            <X size={18} />
          </button>
          
          <h2 className="text-xl font-extrabold text-[#5e35b1] mb-1 flex items-center gap-2">
            ✉️ Hộp Thư Bí Mật (Sticky Note)
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Gửi lời nhắn cho <span className="font-extrabold text-pink-600">{characterName}</span> (Hoàn toàn ẩn danh bbi nhé!)
          </p>

          {success ? (
            <div className="text-center py-8 space-y-2 animate-in zoom-in-90">
              <div className="text-5xl animate-bounce">💖</div>
              <p className="text-lg font-black text-pink-600">Đã gửi thư bí mật thành công!</p>
              <p className="text-xs text-gray-400">Cô giáo và các bé rắn đã nhận được lời nhắn của bạn 🌸</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-[#FFF1E3] border-none focus:ring-4 focus:ring-[#DFD1FF] rounded-2xl p-4 outline-none min-h-[130px] text-gray-700 placeholder:text-gray-400 resize-none text-sm"
                placeholder="Nhập lời tỏ tình, cảm nhận, góp ý hoặc lời nhắn bí mật ở đây..."
                required
              />
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-[#DFD1FF] hover:bg-[#c4b5fd] text-purple-950 font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border border-white text-sm"
              >
                <Send size={16} /> {isSubmitting ? 'Đang gửi...' : 'Gửi Sticky Note Bí Mật ✨'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- View Feedbacks (Admin) Modal ---
export const ViewFeedbacksModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFbs = async () => {
    const fbs = await getFeedbacks();
    setFeedbacks(fbs);
    setLoading(false);
  };

  useEffect(() => {
    loadFbs();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa lời nhắn này?')) {
      await deleteFeedback(id);
      loadFbs();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-[#FFF1E3] rounded-[2.5rem] p-6 md:p-8 w-full max-w-3xl my-auto relative z-10 shadow-2xl border-4 border-[#FFDEF9] max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-sm"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📬</span>
          <h2 className="text-2xl font-black text-[#5e35b1]">
            Hòm Thư Bí Mật Của Lớp ({feedbacks.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <p className="text-center text-gray-500 py-10 text-sm">Đang tải thư...</p>
          ) : feedbacks.length === 0 ? (
            <div className="text-center text-gray-400 py-16 space-y-2">
              <span className="text-4xl block">💌</span>
              <p className="text-sm font-bold">Chưa có lời nhắn nào được gửi về!</p>
            </div>
          ) : (
            feedbacks.map(fb => (
              <div key={fb.id} className="bg-white p-4 rounded-2xl relative group border border-purple-100 shadow-sm">
                <button 
                  onClick={() => handleDelete(fb.id)} 
                  className="absolute top-3 right-3 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 p-1.5 rounded-lg shadow-sm"
                  title="Xóa thư"
                >
                  <Trash2 size={16} />
                </button>
                <div className="text-xs font-bold text-pink-700 mb-1 bg-pink-100 inline-block px-2.5 py-0.5 rounded-full">
                  Gửi tới: {fb.characterId === 'general' ? '🏫 Toàn Thể Lớp Mầm Non' : `Bé ID: ${fb.characterId}`}
                </div>
                <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed mt-1">{fb.content}</p>
                <div className="text-[10px] text-gray-400 mt-2 font-medium">
                  {new Date(fb.timestamp).toLocaleString('vi-VN')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Memory Corner Modal ---
export const MemoryCornerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-[#FFF1E3] rounded-[2.5rem] p-6 md:p-8 w-full max-w-lg my-auto relative z-10 shadow-2xl border-4 border-white max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 text-center">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-sm"
        >
          <X size={18} />
        </button>

        <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 flex items-center justify-center mb-3 border-2 border-pink-200">
          <Heart size={32} className="text-pink-500 fill-pink-500" />
        </div>

        <h3 className="text-2xl font-black text-[#5e35b1] mb-1">
          🤍 Góc Lưu Niệm Mầm Non
        </h3>
        <p className="text-xs text-pink-600 font-medium mb-6">
          🌸 Những kỷ niệm ngọt ngào giữa Cô Giáo Xà Nữ & Các Bé Rắn Con
        </p>

        <div className="space-y-4 text-left text-xs sm:text-sm text-gray-700">
          <div className="bg-white/90 p-4 rounded-2xl border border-pink-100 shadow-sm">
            <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
              <Star size={16} className="text-yellow-500 fill-yellow-500" /> Nội quy đáng yêu của lớp:
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Mỗi ngày uống đủ một bình sữa ấm 🍼</li>
              <li>Thấy crush thì tự tin bò lại gần xin xoa đầu 🐍</li>
              <li>Không cắn bạn, chỉ cắn yêu thôi nha! 💕</li>
            </ul>
          </div>

          <div className="bg-white/90 p-4 rounded-2xl border border-pink-100 shadow-sm">
            <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
              <Sparkles size={16} className="text-pink-500" /> Lời chúc từ Cô Giáo:
            </h4>
            <p className="italic text-gray-600 leading-relaxed">
              "Chúc cho tất cả các bbi ghé thăm luôn tràn ngập niềm vui, mỗi ngày đều tìm thấy một bé rắn đáng yêu quấn quít bên cạnh!"
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#DFD1FF] hover:bg-[#c4b5fd] text-purple-950 font-bold py-3 rounded-xl transition-colors border border-white shadow-sm mt-6 text-sm"
        >
          Trở về lớp học 🌸
        </button>
      </div>
    </div>,
    document.body
  );
};

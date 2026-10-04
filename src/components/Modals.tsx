import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Trash2, Heart, Sparkles, BookOpen, Star, Copy, Check, Lock, Edit2, Plus } from 'lucide-react';
import { addFeedback, getFeedbacks, deleteFeedback, deleteAllPublicFeedbacks, subscribeToFeedbacks, Feedback, getMemoryCorner, updateMemoryCorner, DEFAULT_MEMORY_CORNER, MemoryCornerConfig } from '../lib/data';
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
      await addFeedback({
        characterId,
        characterName,
        senderName: 'Người gửi ẩn danh 🌸',
        color: 'pink',
        content: content.trim(),
        likes: 0,
        isPrivateToTeacher: false,
      });
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClearPublic, setConfirmClearPublic] = useState(false);

  const loadFbs = async () => {
    const fbs = await getFeedbacks();
    setFeedbacks(fbs);
    setLoading(false);
  };

  useEffect(() => {
    loadFbs();
    const unsub = subscribeToFeedbacks((live) => {
      setFeedbacks(live);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      soundManager.playPop();
      const updated = await deleteFeedback(id);
      setFeedbacks(updated);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearPublic = async () => {
    soundManager.playPop();
    const updated = await deleteAllPublicFeedbacks();
    setFeedbacks(updated);
    setConfirmClearPublic(false);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-[#FFF1E3] rounded-[2.5rem] p-6 md:p-8 w-full max-w-3xl my-auto relative z-10 shadow-2xl border-4 border-[#FFDEF9] max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-sm cursor-pointer"
        >
          <X size={18} />
        </button>
        
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pr-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📬</span>
            <h2 className="text-2xl font-black text-[#5e35b1]">
              Quản Lý Hòm Thư Của Lớp ({feedbacks.length})
            </h2>
          </div>

          {feedbacks.some(f => !f.isPrivateToTeacher) && (
            confirmClearPublic ? (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1 rounded-xl">
                <span className="text-xs font-bold text-red-700">Xóa sạch thư công khai?</span>
                <button
                  onClick={handleClearPublic}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg cursor-pointer"
                >
                  Xóa hết
                </button>
                <button
                  onClick={() => setConfirmClearPublic(false)}
                  className="px-2.5 py-1 bg-white text-gray-600 text-xs font-bold rounded-lg border border-gray-200 cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearPublic(true)}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Xóa hết thư công khai</span>
              </button>
            )
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <p className="text-center text-gray-500 py-10 text-sm">Đang tải thư...</p>
          ) : feedbacks.length === 0 ? (
            <div className="text-center text-gray-400 py-16 space-y-2">
              <span className="text-4xl block">💌</span>
              <p className="text-sm font-bold">Chưa có lời nhắn nào trong hòm thư!</p>
            </div>
          ) : (
            feedbacks.map(fb => (
              <div key={fb.id} className="bg-white p-4 rounded-2xl relative border border-purple-100 shadow-sm flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      fb.isPrivateToTeacher ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {fb.isPrivateToTeacher ? <><Lock size={11} /> Thư Riêng Gửi Cô Giáo</> : <>📌 Bảng Tin Công Khai ({fb.characterName || 'Cả lớp'})</>}
                    </span>
                    <span className="text-xs font-bold text-gray-600">
                      Người gửi: {fb.senderName || 'Ẩn danh'}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed mt-1">{fb.content}</p>
                  {fb.adminReply && (
                    <div className="mt-2 p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900">
                      <strong>🌸 Phản hồi của Cô Giáo:</strong> {fb.adminReply}
                    </div>
                  )}
                  <div className="text-[10px] text-gray-400 mt-2 font-medium">
                    {new Date(fb.timestamp).toLocaleString('vi-VN')}
                  </div>
                </div>

                <button 
                  onClick={() => handleDelete(fb.id)}
                  disabled={deletingId === fb.id}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                  title="Xóa vĩnh viễn bức thư này"
                >
                  <Trash2 size={14} />
                  <span>{deletingId === fb.id ? '...' : 'Xóa'}</span>
                </button>
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
export const MemoryCornerModal: React.FC<{ onClose: () => void; isAdmin?: boolean }> = ({ onClose, isAdmin = false }) => {
  const [config, setConfig] = useState<MemoryCornerConfig>(DEFAULT_MEMORY_CORNER);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMemoryCorner().then(setConfig).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      soundManager.playSparkle();
      const cleaned: MemoryCornerConfig = {
        ...config,
        rules: (config.rules || []).map(r => r.trim()).filter(Boolean),
      };
      const saved = await updateMemoryCorner(cleaned);
      setConfig(saved);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-[#FFF1E3] rounded-[2.5rem] p-6 md:p-8 w-full max-w-lg my-auto relative z-10 shadow-2xl border-4 border-white max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 text-center">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-sm cursor-pointer"
        >
          <X size={18} />
        </button>

        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 left-4 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <Edit2 size={12} />
            <span>Sửa Góc Lưu Niệm</span>
          </button>
        )}

        <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 flex items-center justify-center mb-3 border-2 border-pink-200">
          <Heart size={32} className="text-pink-500 fill-pink-500" />
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3 text-left text-xs">
            <div>
              <label className="font-bold text-purple-900 block mb-1">Tiêu đề:</label>
              <input
                type="text"
                value={config.title}
                onChange={e => setConfig({ ...config, title: e.target.value })}
                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-purple-900 block mb-1">Mô tả phụ:</label>
              <input
                type="text"
                value={config.subtitle}
                onChange={e => setConfig({ ...config, subtitle: e.target.value })}
                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-purple-900">Nội quy lớp học:</label>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, rules: [...(config.rules || []), 'Nội quy mới 🌸'] })}
                  className="text-purple-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus size={12} /> Thêm dòng
                </button>
              </div>
              <div className="space-y-1.5">
                {(config.rules || []).map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={rule}
                      onChange={e => {
                        const next = [...config.rules];
                        next[idx] = e.target.value;
                        setConfig({ ...config, rules: next });
                      }}
                      className="flex-1 bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, rules: config.rules.filter((_, i) => i !== idx) })}
                      className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="font-bold text-purple-900 block mb-1">Lời chúc từ Cô Giáo:</label>
              <textarea
                rows={3}
                value={config.wishContent}
                onChange={e => setConfig({ ...config, wishContent: e.target.value })}
                className="w-full bg-white border border-purple-200 rounded-xl p-3 outline-none resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-sm cursor-pointer"
              >
                {saving ? 'Đang lưu...' : 'Lưu Thay Đổi ✨'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <h3 className="text-2xl font-black text-[#5e35b1] mb-1">
              {config.title}
            </h3>
            <p className="text-xs text-pink-600 font-medium mb-6">
              {config.subtitle}
            </p>

            <div className="space-y-4 text-left text-xs sm:text-sm text-gray-700">
              <div className="bg-white/90 p-4 rounded-2xl border border-pink-100 shadow-sm">
                <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" /> {config.rulesTitle || 'Nội quy đáng yêu của lớp:'}
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  {(config.rules || []).map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/90 p-4 rounded-2xl border border-pink-100 shadow-sm">
                <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-pink-500" /> {config.wishTitle || 'Lời chúc từ Cô Giáo:'}
                </h4>
                <p className="italic text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {config.wishContent}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#DFD1FF] hover:bg-[#c4b5fd] text-purple-950 font-bold py-3 rounded-xl transition-colors border border-white shadow-sm mt-6 text-sm cursor-pointer"
            >
              Trở về lớp học 🌸
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

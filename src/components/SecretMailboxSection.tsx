import React, { useState, useEffect } from 'react';
import { Mail, Send, Heart, Trash2, Sparkles, Filter, MessageSquare, Clock, User, ShieldCheck, Lock, Reply, CheckCircle, CornerDownRight } from 'lucide-react';
import { Character, Feedback, getFeedbacks, addFeedback, deleteFeedback, toggleLikeFeedback, getVisitorId, replyFeedback } from '../lib/data';
import { soundManager } from '../lib/audio';

interface SecretMailboxSectionProps {
  characters: Character[];
  isAdmin: boolean;
  preselectedCharId?: string | null;
  onGoToClassroom: () => void;
}

const COLOR_OPTIONS = [
  { id: 'pink', name: 'Hồng Thẹn Thùng 🌸', bg: 'bg-[#FFE8F7]', border: 'border-pink-300', text: 'text-pink-900', badge: 'bg-pink-100 text-pink-700' },
  { id: 'purple', name: 'Tím Mộng Mơ 💜', bg: 'bg-[#EDE4FF]', border: 'border-purple-300', text: 'text-purple-950', badge: 'bg-purple-100 text-purple-700' },
  { id: 'yellow', name: 'Vàng Nắng Ấm 🌻', bg: 'bg-[#FFF9DB]', border: 'border-amber-300', text: 'text-amber-950', badge: 'bg-amber-100 text-amber-800' },
  { id: 'green', name: 'Xanh Bạc Hà 🌿', bg: 'bg-[#E6FCF5]', border: 'border-emerald-300', text: 'text-emerald-950', badge: 'bg-emerald-100 text-emerald-800' },
];

export const SecretMailboxSection: React.FC<SecretMailboxSectionProps> = ({
  characters,
  isAdmin,
  preselectedCharId,
  onGoToClassroom,
}) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [recipientId, setRecipientId] = useState<string>(preselectedCharId || 'teacher_private');
  const [senderName, setSenderName] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('pink');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [activeBoardTab, setActiveBoardTab] = useState<'public' | 'my_private' | 'admin_inbox'>('public');
  const [filterRecipient, setFilterRecipient] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Admin reply states
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const visitorId = getVisitorId();

  const loadFeedbacks = async () => {
    try {
      const data = await getFeedbacks();
      setFeedbacks(data);
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  useEffect(() => {
    if (preselectedCharId) {
      setRecipientId(preselectedCharId);
    }
  }, [preselectedCharId]);

  const isSendingPrivate = recipientId === 'teacher_private';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      let recipientName = 'Toàn Thể Lớp Mầm Non 🏫';
      let isPrivate = false;

      if (recipientId === 'teacher_private') {
        recipientName = 'Cô Giáo Chủ Nhiệm (Thư Riêng 🔒)';
        isPrivate = true;
      } else if (recipientId !== 'general') {
        const found = characters.find(c => c.id === recipientId);
        if (found) recipientName = found.name;
      }

      const updated = await addFeedback({
        characterId: recipientId,
        characterName: recipientName,
        senderName: senderName.trim() || 'Người gửi ẩn danh 🌸',
        color: selectedColor,
        content: content.trim(),
        likes: 0,
        isPrivateToTeacher: isPrivate,
        visitorId: visitorId,
      });

      soundManager.playSparkle();
      setFeedbacks(updated);
      setContent('');
      
      if (isPrivate) {
        setSuccessNotice("Đã gửi thư riêng cho Cô Giáo thành công! Chỉ cô giáo và bạn mới xem được thư này.");
        setActiveBoardTab('my_private');
      } else {
        setSuccessNotice("Đã dán sticky note của bạn lên bảng tin lớp học thành công!");
      }

      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      soundManager.playPop();
      const updated = await deleteFeedback(id);
      setFeedbacks(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLike = async (id: string) => {
    soundManager.playSparkle();
    const updated = await toggleLikeFeedback(id);
    setFeedbacks(updated);
  };

  const handleStartReply = (fb: Feedback) => {
    setReplyingId(fb.id);
    setReplyText(fb.adminReply || '');
  };

  const handleSaveReply = async (id: string) => {
    if (!replyText.trim()) return;
    setIsSendingReply(true);
    try {
      soundManager.playSparkle();
      const updated = await replyFeedback(id, replyText.trim());
      setFeedbacks(updated);
      setReplyingId(null);
      setReplyText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  // 1. Public letters (bình thường, người khác đọc được)
  const publicFeedbacks = feedbacks.filter(fb => !fb.isPrivateToTeacher);
  const filteredPublicFeedbacks = publicFeedbacks.filter(fb => {
    if (filterRecipient === 'all') return true;
    if (filterRecipient === 'general') return fb.characterId === 'general';
    return fb.characterId === filterRecipient;
  });

  // 2. Private letters of THIS visitor (chỉ người gửi này và admin thấy)
  const myPrivateFeedbacks = feedbacks.filter(fb => fb.isPrivateToTeacher && fb.visitorId === visitorId);

  // 3. Admin inbox: All private letters to teacher
  const allPrivateFeedbacks = feedbacks.filter(fb => fb.isPrivateToTeacher);

  const getColorConfig = (colorId?: string) => {
    return COLOR_OPTIONS.find(c => c.id === colorId) || COLOR_OPTIONS[0];
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="glass-card rounded-[2.5rem] p-6 md:p-8 text-center relative overflow-hidden border-4 border-white shadow-lg bg-gradient-to-r from-[#EDE4FF]/90 via-[#FFE8F7]/90 to-[#EDE4FF]/90">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/95 text-purple-950 font-extrabold text-xs px-4 py-1.5 rounded-full shadow-xs border border-purple-200">
            <Mail size={14} className="text-pink-600" />
            <span>Khu Vực Riêng Biệt: Hộp Thư Bí Mật</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-[#523f6b] tracking-tight flex items-center justify-center gap-2">
            <span>💌</span> Hộp Thư & Bảng Tin Bí Mật <span>🌸</span>
          </h2>

          <p className="text-xs md:text-sm text-purple-900/80 font-medium leading-relaxed">
            Gửi sticky note công khai cho lớp, hoặc <span className="font-bold text-pink-700">gửi thư riêng bảo mật cho Cô Giáo Chủ Nhiệm</span> (chỉ mình cô giáo nhận được và phản hồi trực tiếp cho bạn)!
          </p>
        </div>
      </div>

      {/* Main Grid: Form on Left, Bulletin Board on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Viết Thư / Sticky Note */}
        <div className="lg:col-span-5 glass-card rounded-[2.5rem] p-6 md:p-7 border-4 border-white shadow-xl bg-[#FFFBF5] space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
            <div className="p-2 rounded-2xl bg-[#FFE8F7] text-pink-600 shadow-inner">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#4f3e66]">Gửi Thư / Sticky Note</h3>
              <p className="text-[11px] text-gray-500">Bảo mật & an tâm bày tỏ tâm tư bbi nhé 💖</p>
            </div>
          </div>

          {successNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle size={15} className="shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Recipient Dropdown with Highlighted Private Option */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                📬 Bạn muốn gửi thư cho ai:
              </label>
              <select
                value={recipientId}
                onChange={e => setRecipientId(e.target.value)}
                className="w-full bg-white border border-purple-200 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none shadow-xs font-bold"
              >
                <option value="teacher_private" className="text-pink-700 font-extrabold">
                  🔒 Gửi RIÊNG cho Cô Giáo Chủ Nhiệm (Bảo mật 100%, chỉ cô giáo đọc & trả lời bạn)
                </option>
                <option value="general">
                  🏫 Gửi công khai lên bảng tin toàn thể lớp Mầm Non
                </option>
                {characters.map(char => (
                  <option key={char.id} value={char.id}>
                    🐍 Gửi công khai cho bé {char.name}
                  </option>
                ))}
              </select>

              {isSendingPrivate ? (
                <div className="mt-1.5 p-2 bg-pink-50 border border-pink-200 rounded-xl text-[11px] text-pink-700 flex items-center gap-1.5">
                  <Lock size={12} className="shrink-0 text-pink-600" />
                  <span>Chế độ riêng tư: Người khác sẽ <strong>không đọc được</strong> thư này. Cô giáo sẽ phản hồi lại ngay trong hộp thư của bạn!</span>
                </div>
              ) : (
                <div className="mt-1.5 p-2 bg-purple-50 border border-purple-100 rounded-xl text-[11px] text-purple-800 flex items-center gap-1.5">
                  <span>📌</span>
                  <span>Chế độ công khai: Bức thư sẽ được ghim lên bảng tin lớp học để mọi người cùng đọc.</span>
                </div>
              )}
            </div>

            {/* Sender Nickname */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                🏷️ Biệt danh của bạn (Tùy chọn):
              </label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="Để trống sẽ là 'Người gửi ẩn danh 🌸'"
                className="w-full bg-white border border-purple-200 focus:border-purple-400 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none shadow-xs"
              />
            </div>

            {/* Sticky Note Color Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                🎨 Màu giấy thư:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedColor(opt.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedColor === opt.id
                        ? `${opt.bg} ${opt.border} ring-2 ring-purple-300 shadow-sm scale-102`
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: opt.id === 'pink' ? '#FFD1EC' : opt.id === 'purple' ? '#E1D4FC' : opt.id === 'yellow' ? '#FFF394' : '#C3FAE8' }} />
                    <span className="truncate">{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                ✍️ Nội dung bức thư *
              </label>
              <textarea
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                placeholder={isSendingPrivate ? "Nhập tâm sự riêng tư, câu hỏi hoặc lời nhắn gửi riêng cho Cô Giáo..." : "Nhập tâm sự, lời khen ngợi hoặc lời thì thầm ngọt ngào cho lớp..."}
                className="w-full bg-white border border-purple-200 focus:border-purple-400 rounded-2xl p-3.5 text-xs text-gray-800 outline-none shadow-xs resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#DFD1FF] via-[#EDE4FF] to-[#FFDEF9] hover:from-[#d5c3fc] hover:to-[#ffd2f5] text-purple-950 font-black text-xs sm:text-sm shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-2 border-2 border-white disabled:opacity-50"
            >
              <Send size={15} className="text-purple-700" />
              <span>{isSubmitting ? 'Đang gửi thư...' : isSendingPrivate ? 'Gửi Riêng Cho Cô Giáo 🔒' : 'Dán Lên Bảng Tin Lớp Học ✨'}</span>
            </button>
          </form>
        </div>

        {/* Right Area: Bảng Tin Công Khai & Hộp Thư Riêng Tư */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Tab Selector on Bulletin Board */}
          <div className="glass-card rounded-2xl p-2 border border-white shadow-sm flex flex-wrap items-center gap-2 bg-white/80">
            <button
              onClick={() => setActiveBoardTab('public')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeBoardTab === 'public'
                  ? 'bg-gradient-to-r from-[#DFD1FF] to-[#FFDEF9] text-purple-950 font-black shadow-xs border border-white'
                  : 'text-gray-600 hover:text-purple-900 hover:bg-white/60'
              }`}
            >
              <span>📌 Bảng Tin Lớp Học ({publicFeedbacks.length})</span>
            </button>

            <button
              onClick={() => setActiveBoardTab('my_private')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeBoardTab === 'my_private'
                  ? 'bg-gradient-to-r from-[#DFD1FF] to-[#FFDEF9] text-purple-950 font-black shadow-xs border border-white'
                  : 'text-gray-600 hover:text-purple-900 hover:bg-white/60'
              }`}
            >
              <Lock size={12} className="text-pink-600" />
              <span>Thư Riêng Của Bạn ({myPrivateFeedbacks.length})</span>
              {myPrivateFeedbacks.some(f => f.adminReply) && (
                <span className="bg-pink-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  Có phản hồi!
                </span>
              )}
            </button>

            {/* Admin Dedicated Tab to view and reply all private letters */}
            {isAdmin && (
              <button
                onClick={() => setActiveBoardTab('admin_inbox')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeBoardTab === 'admin_inbox'
                    ? 'bg-red-500 text-white font-black shadow-xs border border-white'
                    : 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                }`}
              >
                <ShieldCheck size={13} />
                <span>👑 Hòm Thư Cô Giáo ({allPrivateFeedbacks.length})</span>
              </button>
            )}
          </div>

          {/* TAB 1: BẢNG TIN CÔNG KHAI (Chỉ các thư không bảo mật) */}
          {activeBoardTab === 'public' && (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="flex items-center justify-between px-2 text-xs text-gray-500">
                <span>Hiển thị thư công khai của các bé ngoan</span>
                <div className="flex items-center gap-2">
                  <Filter size={12} />
                  <select
                    value={filterRecipient}
                    onChange={e => setFilterRecipient(e.target.value)}
                    className="bg-white border border-purple-100 rounded-xl px-2.5 py-1 text-xs text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả ({publicFeedbacks.length})</option>
                    <option value="general">Chung cả lớp ({publicFeedbacks.filter(f => f.characterId === 'general').length})</option>
                    {characters.map(c => (
                      <option key={c.id} value={c.id}>
                        Bé {c.name} ({publicFeedbacks.filter(f => f.characterId === c.id).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredPublicFeedbacks.length === 0 ? (
                <div className="glass-card rounded-[2.5rem] p-12 text-center border-4 border-white shadow-sm bg-white/70 space-y-2">
                  <span className="text-4xl block">📬</span>
                  <p className="font-bold text-gray-700 text-sm">Chưa có bức thư công khai nào</p>
                  <p className="text-xs text-gray-400">Hãy là người đầu tiên viết một sticky note ngọt ngào nhé!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredPublicFeedbacks.map(fb => {
                    const color = getColorConfig(fb.color);

                    return (
                      <div
                        key={fb.id}
                        className={`rounded-2xl p-4.5 border-2 shadow-sm relative transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between space-y-3 ${color.bg} ${color.border}`}
                      >
                        {/* Tape Deco */}
                        <div className="w-12 h-3.5 bg-white/60 -top-2 left-1/2 -translate-x-1/2 absolute rounded-sm border border-white/80 shadow-2xs rotate-1" />

                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border border-black/5 shadow-2xs truncate max-w-[170px] ${color.badge}`}>
                              Gửi: {fb.characterName || 'Cả Lớp 🏫'}
                            </span>
                            
                            <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1 shrink-0">
                              <Clock size={10} /> {formatTime(fb.timestamp)}
                            </span>
                          </div>

                          <p className={`text-xs sm:text-[13px] font-medium leading-relaxed whitespace-pre-wrap ${color.text}`}>
                            {fb.content}
                          </p>
                        </div>

                        {/* Note Footer */}
                        <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1 truncate max-w-[130px]">
                            <User size={11} className="text-gray-400" />
                            <span>{fb.senderName || 'Ẩn danh'}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleLike(fb.id)}
                              className="px-2 py-1 rounded-lg bg-white/80 hover:bg-white text-pink-600 text-[11px] font-bold shadow-2xs border border-pink-100 flex items-center gap-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                              title="Thả tim cho bức thư"
                            >
                              <Heart size={12} className={fb.likes ? 'fill-pink-500 text-pink-500' : ''} />
                              <span>{fb.likes || 0}</span>
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(fb.id)}
                                disabled={deletingId === fb.id}
                                className="p-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 text-[10px] font-bold transition-colors cursor-pointer"
                                title="Admin xóa thư này"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: THƯ RIÊNG CỦA BẠN & PHẢN HỒI TỪ CÔ GIÁO */}
          {activeBoardTab === 'my_private' && (
            <div className="space-y-4">
              <div className="p-3 bg-pink-50/80 border border-pink-200 rounded-2xl text-xs text-pink-800 flex items-center gap-2">
                <Lock size={14} className="text-pink-600 shrink-0" />
                <span>Đây là hộp thư riêng giữa bạn và Cô Giáo. <strong>Người truy cập khác tuyệt đối không biết và không đọc được!</strong></span>
              </div>

              {myPrivateFeedbacks.length === 0 ? (
                <div className="glass-card rounded-[2.5rem] p-10 text-center border-4 border-white shadow-sm bg-white/80 space-y-2">
                  <span className="text-4xl block">🌸</span>
                  <p className="font-bold text-gray-800 text-sm">Bạn chưa gửi bức thư riêng nào cho Cô Giáo</p>
                  <p className="text-xs text-gray-500">Hãy chọn mục <strong>"Gửi RIÊNG cho Cô Giáo"</strong> ở biểu mẫu bên trái để nhắn nhủ tâm sự nhé!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPrivateFeedbacks.map(fb => (
                    <div key={fb.id} className="glass-card rounded-2xl p-5 border-2 border-pink-200 bg-white shadow-md space-y-3">
                      {/* Top: Letter sent by visitor */}
                      <div className="space-y-1.5 pb-3 border-b border-pink-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-extrabold text-pink-700 flex items-center gap-1">
                            <Lock size={12} /> Thư của bạn gửi Cô Giáo
                          </span>
                          <span className="text-[11px]">{formatTime(fb.timestamp)}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-[#FFFBF5] p-3 rounded-xl border border-orange-100">
                          {fb.content}
                        </p>
                      </div>

                      {/* Bottom: Teacher's Response */}
                      <div className="pt-1">
                        {fb.adminReply ? (
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-3.5 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-purple-900 flex items-center gap-1.5">
                                <span>🌸</span> Phản hồi từ Cô Giáo Xà Nữ:
                              </span>
                              {fb.adminRepliedAt && (
                                <span className="text-[10px] text-gray-400">{formatTime(fb.adminRepliedAt)}</span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-purple-950 leading-relaxed font-semibold whitespace-pre-wrap">
                              {fb.adminReply}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 flex items-center gap-2 italic">
                            <Clock size={13} className="text-orange-400" />
                            <span>Cô giáo đã nhận được thư và đang chuẩn bị phản hồi cho riêng bạn... Vui lòng quay lại kiểm tra sau nhé!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADMIN INBOX (Admin xem toàn bộ thư riêng & viết phản hồi) */}
          {isAdmin && activeBoardTab === 'admin_inbox' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-purple-700 shrink-0" />
                <span>Khu vực Quản trị viên: Toàn bộ thư riêng gửi cho Cô Giáo. Admin có thể phản hồi trực tiếp cho từng người gửi.</span>
              </div>

              {allPrivateFeedbacks.length === 0 ? (
                <div className="glass-card rounded-[2.5rem] p-10 text-center border-4 border-white shadow-sm bg-white/80">
                  <span className="text-4xl block">✨</span>
                  <p className="font-bold text-gray-800 text-sm mt-2">Chưa có ai gửi thư riêng cho Cô Giáo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allPrivateFeedbacks.map(fb => (
                    <div key={fb.id} className="glass-card rounded-2xl p-5 border-2 border-purple-200 bg-white shadow-md space-y-3">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-purple-100">
                        <span className="font-black text-purple-900 flex items-center gap-1.5">
                          <User size={13} /> {fb.senderName || 'Người gửi ẩn danh'}
                          <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">Thư Riêng 🔒</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400">{formatTime(fb.timestamp)}</span>
                          <button
                            onClick={() => handleDelete(fb.id)}
                            className="p-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 cursor-pointer"
                            title="Xóa thư này"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Content of visitor */}
                      <p className="text-xs sm:text-sm text-gray-800 leading-relaxed bg-[#FFFBF5] p-3 rounded-xl border border-orange-100">
                        {fb.content}
                      </p>

                      {/* Admin Response section */}
                      <div className="pt-2">
                        {replyingId === fb.id ? (
                          <div className="space-y-2 bg-purple-50 p-3 rounded-xl border border-purple-200">
                            <label className="block text-xs font-bold text-purple-900">
                              ✍️ Viết lời phản hồi của Cô Giáo (Chỉ người này đọc được):
                            </label>
                            <textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              rows={3}
                              placeholder="Nhập phản hồi dịu dàng từ Cô Giáo gửi riêng cho bạn này..."
                              className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-xs text-gray-800 outline-none resize-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setReplyingId(null)}
                                className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                disabled={isSendingReply || !replyText.trim()}
                                onClick={() => handleSaveReply(fb.id)}
                                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-sm cursor-pointer flex items-center gap-1"
                              >
                                <Reply size={12} />
                                <span>{isSendingReply ? 'Đang gửi...' : 'Gửi Phản Hồi'}</span>
                              </button>
                            </div>
                          </div>
                        ) : fb.adminReply ? (
                          <div className="bg-pink-50 p-3 rounded-xl border border-pink-200 flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <span className="text-[11px] font-black text-pink-700 flex items-center gap-1">
                                <CornerDownRight size={12} /> Đã phản hồi:
                              </span>
                              <p className="text-xs text-purple-950 font-medium whitespace-pre-wrap">
                                {fb.adminReply}
                              </p>
                            </div>
                            <button
                              onClick={() => handleStartReply(fb)}
                              className="text-[11px] text-purple-700 hover:underline font-bold shrink-0"
                            >
                              Sửa phản hồi
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartReply(fb)}
                            className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Reply size={13} />
                            <span>Phản hồi lại cho bạn này 💌</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

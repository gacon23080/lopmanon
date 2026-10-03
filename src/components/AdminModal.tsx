import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, MessageSquare, Plus, Edit, LogOut, Trash2, Users, ArrowLeft, Tag as TagIcon } from 'lucide-react';
import { soundManager } from '../lib/audio';
import { Character } from '../lib/data';

interface AdminModalProps {
  onClose: () => void;
  onLogin: (success: boolean) => void;
  isAdmin: boolean;
  onOpenTeacherEdit: () => void;
  onOpenAddCharacter: () => void;
  onOpenViewFeedbacks: () => void;
  onLogout: () => void;
  characters?: Character[];
  onDeleteCharacter?: (id: string) => Promise<void> | void;
  onDeleteTag?: (tag: string) => Promise<void> | void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  onClose,
  onLogin,
  isAdmin,
  onOpenTeacherEdit,
  onOpenAddCharacter,
  onOpenViewFeedbacks,
  onLogout,
  characters = [],
  onDeleteCharacter,
  onDeleteTag,
}) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'menu' | 'manageCharacters' | 'manageTags'>('menu');
  const [charSearch, setCharSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id.trim() === '23082010' && password.trim() === 'Gacon23082010') {
      soundManager.playSparkle();
      onLogin(true);
    } else {
      setError('Mã đăng nhập hoặc mật khẩu không chính xác!');
    }
  };

  const handleDelete = async (charId: string, charName: string) => {
    if (!onDeleteCharacter) return;
    setDeletingId(charId);
    try {
      soundManager.playPop();
      await onDeleteCharacter(charId);
    } catch (err) {
      console.error("Error deleting char:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteTagAction = async (tag: string) => {
    if (!onDeleteTag) return;
    setDeletingTag(tag);
    try {
      soundManager.playPop();
      await onDeleteTag(tag);
    } catch (err) {
      console.error("Error deleting tag:", err);
    } finally {
      setDeletingTag(null);
    }
  };

  const filteredChars = characters.filter(c => 
    c.name.toLowerCase().includes(charSearch.toLowerCase()) ||
    (c.tags || []).some(t => t.toLowerCase().includes(charSearch.toLowerCase()))
  );

  // Extract all unique tags and count usage
  const allUniqueTags = Array.from(new Set(characters.flatMap(c => c.tags || [])));
  const filteredTags = allUniqueTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()));

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-[#FFF1E3] rounded-3xl p-5 md:p-7 w-full max-w-lg my-auto relative z-10 shadow-2xl border-4 border-[#FFDEF9] transform transition-all animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-sm cursor-pointer z-10"
        >
          <X size={18} />
        </button>
        
        {isAdmin ? (
          activeTab === 'manageCharacters' ? (
            /* DEDICATED CHARACTER MANAGEMENT TAB */
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('menu')}
                  className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 shadow-sm cursor-pointer transition-transform hover:scale-105"
                  title="Quay lại menu"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-[#5e35b1] flex items-center gap-1.5">
                    <span>🗑️</span> Quản Lý & Xóa Bé Rắn
                  </h2>
                  <p className="text-[11px] text-gray-600">Tổng cộng {characters.length} bé trong lớp</p>
                </div>
              </div>

              {/* Search input */}
              <input
                type="text"
                placeholder="Tìm tên bé rắn cần xóa..."
                value={charSearch}
                onChange={(e) => setCharSearch(e.target.value)}
                className="w-full bg-white border border-purple-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-purple-400"
              />

              {/* Character list with instant delete buttons */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[50vh]">
                {filteredChars.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    Không tìm thấy bé rắn nào!
                  </div>
                ) : (
                  filteredChars.map((char) => (
                    <div
                      key={char.id}
                      className="bg-white/95 rounded-2xl p-3 border border-purple-100 shadow-xs flex items-center gap-3 transition-all hover:border-purple-300"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-50 shrink-0 border border-purple-100 flex items-center justify-center">
                        {char.imageUrl ? (
                          <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">🐍</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-purple-950 truncate">{char.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {char.is18Plus && (
                            <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded-full">
                              18+
                            </span>
                          )}
                          {(char.tags || []).slice(0, 2).map((t) => (
                            <span key={t} className="text-[9px] bg-purple-50 text-purple-700 font-medium px-1.5 py-0.2 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        disabled={deletingId === char.id}
                        onClick={() => handleDelete(char.id, char.name)}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                        title="Xóa bé rắn này ngay"
                      >
                        {deletingId === char.id ? (
                          <span className="animate-spin text-xs">⏳</span>
                        ) : (
                          <>
                            <Trash2 size={13} />
                            <span>Xóa</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setActiveTab('menu')}
                className="w-full py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 cursor-pointer"
              >
                ← Quay Lại Bàn Làm Việc
              </button>
            </div>
          ) : activeTab === 'manageTags' ? (
            /* DEDICATED TAG MANAGEMENT TAB */
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('menu')}
                  className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 shadow-sm cursor-pointer transition-transform hover:scale-105"
                  title="Quay lại menu"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-[#5e35b1] flex items-center gap-1.5">
                    <span>🏷️</span> Quản Lý & Xóa Tag Toàn Bộ
                  </h2>
                  <p className="text-[11px] text-gray-600">Tổng cộng {allUniqueTags.length} tag đang dùng trong lớp</p>
                </div>
              </div>

              {/* Search Tag input */}
              <input
                type="text"
                placeholder="Tìm tên tag cần xóa..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full bg-white border border-purple-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-purple-400"
              />

              {/* Tag list with count and delete buttons */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[50vh]">
                {filteredTags.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    Không có tag nào phù hợp!
                  </div>
                ) : (
                  filteredTags.map((tag) => {
                    const count = characters.filter(c => c.tags && c.tags.includes(tag)).length;
                    const is18 = tag === '18+';

                    return (
                      <div
                        key={tag}
                        className="bg-white/95 rounded-2xl p-3 border border-purple-100 shadow-xs flex items-center justify-between gap-3 transition-all hover:border-purple-300"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                            is18 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-purple-50 text-purple-900 border-purple-200'
                          }`}>
                            {is18 ? '🔞 18+' : tag}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium truncate">
                            (Đang gắn cho {count} bé rắn)
                          </span>
                        </div>

                        {/* Delete Tag Button */}
                        <button
                          disabled={deletingTag === tag}
                          onClick={() => handleDeleteTagAction(tag)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                          title={`Xóa tag "${tag}" khỏi toàn bộ bé rắn`}
                        >
                          {deletingTag === tag ? (
                            <span className="animate-spin text-xs">⏳</span>
                          ) : (
                            <>
                              <Trash2 size={12} />
                              <span>Xóa Tag</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => setActiveTab('menu')}
                className="w-full py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 cursor-pointer"
              >
                ← Quay Lại Bàn Làm Việc
              </button>
            </div>
          ) : (
            /* ADMIN MAIN MENU */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 flex items-center justify-center border-2 border-pink-200">
                <span className="text-3xl">👑</span>
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-[#5e35b1]">Bàn Làm Việc Cô Giáo</h2>
                <p className="text-xs text-pink-600 font-medium mt-1">Xin chào Cô Giáo Chủ Nhiệm Xà Nữ! 🌸</p>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* 1. Delete & Manage Characters */}
                <button
                  onClick={() => setActiveTab('manageCharacters')}
                  className="w-full bg-white hover:bg-red-50 text-red-950 font-bold py-3 px-4 rounded-2xl border-2 border-red-200 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02] text-sm cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-red-100 text-red-600"><Trash2 size={16} /></div>
                  <div className="text-left flex-1">
                    <div className="text-red-700 font-black">Quản Lý & Xóa Bé Rắn ({characters.length})</div>
                    <div className="text-[10px] text-gray-500 font-normal">Xóa nhanh bất kỳ bé nào khỏi lớp</div>
                  </div>
                </button>

                {/* 2. Manage & Delete Tags */}
                <button
                  onClick={() => setActiveTab('manageTags')}
                  className="w-full bg-white hover:bg-purple-50 text-purple-950 font-bold py-3 px-4 rounded-2xl border-2 border-purple-200 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02] text-sm cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700"><TagIcon size={16} /></div>
                  <div className="text-left flex-1">
                    <div className="text-purple-900 font-black">Quản Lý & Xóa Tag ({allUniqueTags.length} tag)</div>
                    <div className="text-[10px] text-gray-500 font-normal">Gỡ tag thừa hoặc tag cũ khỏi toàn bộ bé rắn</div>
                  </div>
                </button>

                {/* 3. Add Character */}
                <button
                  onClick={() => { onClose(); onOpenAddCharacter(); }}
                  className="w-full bg-white hover:bg-green-50 text-green-900 font-bold py-3 px-4 rounded-2xl border border-green-100 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02] text-sm cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-green-100 text-green-700"><Plus size={16} /></div>
                  <div className="text-left flex-1">
                    <div>Thêm Bé Rắn Mới Vào Lớp</div>
                    <div className="text-[10px] text-gray-400 font-normal">Thêm ảnh, Google AI, nhạc, tag 18+...</div>
                  </div>
                </button>

                {/* 4. Teacher Profile */}
                <button
                  onClick={() => { onClose(); onOpenTeacherEdit(); }}
                  className="w-full bg-white hover:bg-purple-50 text-purple-950 font-bold py-3 px-4 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02] text-sm cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700"><Edit size={16} /></div>
                  <div className="text-left flex-1">
                    <div>Đổi Ảnh & Thông Tin Cô Giáo</div>
                    <div className="text-[10px] text-gray-400 font-normal">Cập nhật avatar, slogan, bio...</div>
                  </div>
                </button>

                {/* 5. Anonymous Feedbacks */}
                <button
                  onClick={() => { onClose(); onOpenViewFeedbacks(); }}
                  className="w-full bg-white hover:bg-pink-50 text-pink-900 font-bold py-3 px-4 rounded-2xl border border-pink-100 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02] text-sm cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-pink-100 text-pink-700"><MessageSquare size={16} /></div>
                  <div className="text-left flex-1">
                    <div>Hộp Thư Ẩn Danh & Sticky Notes</div>
                    <div className="text-[10px] text-gray-400 font-normal">Đọc và quản lý tin nhắn gửi về</div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => { onLogout(); onClose(); }}
                className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2.5 rounded-xl transition-colors text-xs flex items-center justify-center gap-2 mt-3 cursor-pointer"
              >
                <LogOut size={15} /> Đăng Xuất Quyền Admin
              </button>
            </div>
          )
        ) : (
          /* LOGIN FORM WITHOUT SUGGESTION / HINT */
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-2 border-2 border-purple-200">
                <Lock size={28} className="text-purple-700" />
              </div>
              <h2 className="text-2xl font-black text-[#5e35b1]">Khu Vực Admin</h2>
              <p className="text-xs text-gray-500 mt-1">Dành riêng cho Cô Giáo Chủ Nhiệm</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mã đăng nhập (ID)</label>
                <input 
                  type="text" 
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full bg-white border-2 border-gray-200 focus:border-[#C4B5FD] rounded-xl px-4 py-2.5 outline-none text-sm transition-colors text-gray-800"
                  placeholder="Nhập mã ID..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-gray-200 focus:border-[#C4B5FD] rounded-xl px-4 py-2.5 outline-none text-sm transition-colors text-gray-800"
                  placeholder="Nhập mật khẩu..."
                  required
                />
              </div>

              {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}

              <button 
                type="submit"
                className="w-full bg-[#DFD1FF] hover:bg-[#c4b5fd] text-purple-950 font-extrabold py-3 rounded-xl transition-all border border-white shadow-md mt-4 text-sm cursor-pointer"
              >
                Mở Khóa Lớp Học ✨
              </button>
            </form>
          </>
        )}

      </div>
    </div>,
    document.body
  );
};

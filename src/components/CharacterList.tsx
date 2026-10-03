import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Edit2, Trash2, MessageSquare, ExternalLink, BookOpen, Plus, ShieldAlert, Dices, Music, Sparkles, X, Tag as TagIcon } from 'lucide-react';
import { Character, deleteCharacter, deleteTagGlobally } from '../lib/data';
import { CharacterFormModal } from './CharacterFormModal';
import { CharacterDetailModal } from './CharacterDetailModal';
import { SubmitFeedbackModal } from './Modals';
import { AgeVerificationModal } from './AgeVerificationModal';
import { soundManager } from '../lib/audio';

interface CharacterListProps {
  characters: Character[];
  isAdmin: boolean;
  onDataChange: (updatedChars?: Character[]) => void;
  onOpenRandomHusband: () => void;
  isAgeVerified: boolean;
  onVerifyAge: () => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  isAdmin,
  onDataChange,
  onOpenRandomHusband,
  isAgeVerified,
  onVerifyAge,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  
  const [selectedDetailChar, setSelectedDetailChar] = useState<Character | null>(null);
  const [feedbackChar, setFeedbackChar] = useState<Character | null>(null);
  const [charToDelete, setCharToDelete] = useState<Character | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Tag Deletion state
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isDeletingTag, setIsDeletingTag] = useState(false);
  
  // Age verification state for pending action
  const [pending18Char, setPending18Char] = useState<Character | null>(null);

  const isChar18Plus = (char: Character): boolean => {
    return !!char.is18Plus || (char.tags || []).some(t => ['18+', 'r18', 'h+', 'nsfw', '+18'].includes(t.toLowerCase().trim()));
  };

  const handleOpenDetail = (char: Character) => {
    if (isChar18Plus(char) && !isAgeVerified) {
      setPending18Char(char);
      return;
    }
    setSelectedDetailChar(char);
  };

  const handleAgeVerifiedSuccess = () => {
    onVerifyAge();
    if (pending18Char) {
      setSelectedDetailChar(pending18Char);
      setPending18Char(null);
    }
  };

  // Immediate deletion of character via custom modal (No window.confirm!)
  const handleDeleteClick = (char: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    setCharToDelete(char);
  };

  const handleConfirmDelete = async () => {
    if (!charToDelete) return;
    try {
      setIsDeleting(true);
      soundManager.playPop();
      const updated = await deleteCharacter(charToDelete.id);
      onDataChange(updated);
      setCharToDelete(null);
    } catch (err) {
      console.error("Error deleting character:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteTag = async () => {
    if (!tagToDelete) return;
    try {
      setIsDeletingTag(true);
      soundManager.playPop();
      const updated = await deleteTagGlobally(tagToDelete);
      if (selectedTag === tagToDelete) {
        setSelectedTag('Tất cả');
      }
      onDataChange(updated);
      setTagToDelete(null);
    } catch (err) {
      console.error("Error deleting tag:", err);
    } finally {
      setIsDeletingTag(false);
    }
  };

  const openEdit = (char: Character, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingChar(char);
    setShowFormModal(true);
  };

  const openAdd = () => {
    setEditingChar(null);
    setShowFormModal(true);
  };

  // Get list of all unique tags across characters for filtering
  const allTags = ['Tất cả', ...Array.from(new Set(characters.flatMap(c => c.tags || [])))];

  const filteredCharacters = characters.filter(c => {
    const matchesTag = selectedTag === 'Tất cả' || (c.tags && c.tags.includes(selectedTag));
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.story && c.story.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.tags && c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesTag && matchesSearch;
  });

  return (
    <section id="characters" className="space-y-6 pt-2">
      
      {/* Header bar of Character list */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl md:text-3xl font-black text-[#5a4872] flex items-center gap-2">
            <span>🕒</span> Bé Rắn Của Lớp
          </h3>
          <button
            onClick={onOpenRandomHusband}
            className="glass-pill px-3.5 py-1.5 rounded-full text-xs font-bold text-pink-700 hover:bg-pink-100 flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105 cursor-pointer"
          >
            <Dices size={14} /> Random Bé Chồng 🎲
          </button>
        </div>
        
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            placeholder="Tìm tên hoặc tag bé rắn..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/80 border-2 border-white focus:border-[#C4B5FD] outline-none rounded-full py-2.5 pl-10 pr-4 shadow-sm text-sm text-gray-700 placeholder:text-gray-400"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-purple-400" />
        </div>
      </div>

      {/* Filter Tags with Admin Delete Tag Capability */}
      <div className="flex flex-wrap items-center gap-2">
        {allTags.map(tag => {
          const isSelected = selectedTag === tag;
          const isTag18 = tag === '18+';
          const canDelete = isAdmin && tag !== 'Tất cả';

          return (
            <div key={tag} className="relative inline-flex items-center group/tag">
              <button
                onClick={() => setSelectedTag(tag)}
                className={`py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  canDelete ? 'pl-3.5 pr-7' : 'px-3.5'
                } ${
                  isSelected
                    ? isTag18
                      ? 'bg-red-500 text-white border-red-500 shadow-sm scale-102'
                      : 'bg-[#EDE4FF] text-purple-950 border-purple-300 shadow-sm scale-102 font-black'
                    : isTag18
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      : 'bg-white/70 text-gray-600 border-transparent hover:bg-white shadow-sm'
                }`}
              >
                <span>{isTag18 ? '🔞 18+' : tag}</span>
              </button>

              {/* Admin Delete Tag Button */}
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTagToDelete(tag);
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center text-[10px] font-black transition-all shadow-2xs cursor-pointer hover:scale-110"
                  title={`Admin xóa tag "${tag}" khỏi toàn bộ bé rắn`}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}

        {isAdmin && (
          <button 
            onClick={openAdd} 
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#EDE4FF] hover:bg-[#ded2fb] text-purple-950 transition-colors flex items-center gap-1.5 shadow-sm border border-purple-200 ml-auto cursor-pointer"
          >
            <Plus size={15} className="text-purple-700" /> Thêm Bé Rắn Mới
          </button>
        )}
      </div>

      {/* Grid of Character Cards with Vertical Portrait Aspect Ratio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCharacters.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-500 glass-card rounded-3xl space-y-2">
            <span className="text-4xl block">🥺🐍</span>
            <p className="font-bold text-base text-purple-900">Không tìm thấy bé rắn nào phù hợp!</p>
            <p className="text-xs text-gray-400">Hãy thử chọn mục "Tất cả" hoặc nhập từ khóa khác nhé.</p>
          </div>
        ) : (
          filteredCharacters.map(char => {
            const has18 = isChar18Plus(char);
            const linkTarget = char.linkUrl || char.googleAiLink;
            const linkText = char.linkLabel || "Google AI 🤖";

            return (
              <div 
                key={char.id} 
                onClick={() => handleOpenDetail(char)}
                className={`glass-card rounded-[2rem] p-5 flex flex-col h-full border-2 transition-all hover:-translate-y-1.5 hover:shadow-xl relative overflow-hidden group cursor-pointer ${
                  has18 ? 'border-pink-200 bg-gradient-to-b from-white/90 to-[#FFF5FB]/90' : 'border-white'
                }`}
              >
                {/* 18+ Badge */}
                {has18 && (
                  <div className="absolute top-4 right-4 z-10 bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <ShieldAlert size={12} /> 18+
                  </div>
                )}

                {/* Prominent Admin Bar on Card */}
                {isAdmin && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 border border-purple-200/90 rounded-xl p-2 mb-3 flex items-center justify-between shadow-xs z-20"
                  >
                    <span className="text-[11px] font-black text-purple-900 flex items-center gap-1">
                      <span>👑</span> Quyền Admin
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={(e) => openEdit(char, e)} 
                        title="Sửa thông tin bé rắn"
                        className="px-2.5 py-1 bg-white hover:bg-yellow-50 text-yellow-800 text-[11px] font-bold rounded-lg border border-yellow-200 flex items-center gap-1 shadow-xs cursor-pointer transition-transform hover:scale-105"
                      >
                        <Edit2 size={12} className="text-yellow-600" /> Sửa
                      </button>
                      <button 
                        onClick={(e) => handleDeleteClick(char, e)} 
                        title="Xóa bé rắn này khỏi lớp học ngay lập tức"
                        className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-transform hover:scale-105"
                      >
                        <Trash2 size={12} /> Xóa Bé Rắn
                      </button>
                    </div>
                  </div>
                )}

                {/* Character Photo (KHUNG ẢNH DỌC - VERTICAL 3:4 RATIO) */}
                <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-tr from-[#EDE4FF] to-[#FFE8F7] mb-3.5 relative shadow-inner flex items-center justify-center border border-purple-100 group-hover:shadow-md transition-all">
                  {char.imageUrl ? (
                    <img 
                      src={char.imageUrl} 
                      alt={char.name} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center text-gray-400 p-4">
                      <span className="text-5xl block mb-2">🐍</span>
                      <span className="text-xs font-bold text-purple-900">Mầm Non Rắn Con</span>
                    </div>
                  )}

                  {/* Music indicator on photo if available */}
                  {char.youtubeMusicUrl && (
                    <div className="absolute bottom-2 right-2 bg-pink-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-xs">
                      <Music size={11} /> Có nhạc nền
                    </div>
                  )}

                  {/* Click to view detail hint overlay on hover */}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 text-purple-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md">
                      Bấm xem hồ sơ & Story ✨
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-lg font-black text-[#4f3d66] mb-1 line-clamp-1 group-hover:text-pink-600 transition-colors">
                  {char.name}
                </h4>

                {/* Tags List */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {(char.tags || []).map(t => {
                    const is18 = ['18+', 'r18', 'h+', 'nsfw', '+18'].includes(t.toLowerCase());
                    return (
                      <span
                        key={t}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          is18
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-[#EDE4FF] text-purple-900 border-purple-100'
                        }`}
                      >
                        {is18 ? `🔞 ${t}` : t}
                      </span>
                    );
                  })}
                </div>

                {/* Quick Profile Snippets (Tuổi & Ngày sinh) */}
                {(char.age || char.birthday) && (
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-purple-800 mb-2">
                    {char.age && <span className="bg-purple-50 px-2 py-0.5 rounded-md">🎂 {char.age}</span>}
                    {char.birthday && <span className="bg-pink-50 px-2 py-0.5 rounded-md">🎈 {char.birthday}</span>}
                  </div>
                )}

                {/* Bio */}
                <p className="text-xs text-gray-600 mb-4 flex-1 line-clamp-2 leading-relaxed">
                  {char.bio}
                </p>

                {/* Action Buttons: Xem Profile & Story, Custom Link Label do Admin sửa */}
                <div className="space-y-2 pt-2 border-t border-purple-100/80" onClick={e => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-2">
                    {/* View Profile & Story Button (Tự động bật nhạc in-app) */}
                    <button 
                      onClick={() => handleOpenDetail(char)} 
                      className="flex items-center justify-center gap-1.5 bg-[#EDE4FF] hover:bg-[#ded2fb] py-2 px-2 rounded-xl text-purple-950 transition-all border border-purple-200 shadow-sm text-xs font-black hover:scale-102 cursor-pointer"
                    >
                      <BookOpen size={14} className="text-purple-700" /> Hồ Sơ & Story
                    </button>
                    
                    {/* Custom Link Button (Tên nút do admin sửa) */}
                    {linkTarget ? (
                      <a 
                        href={linkTarget} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center justify-center gap-1.5 bg-blue-50/90 hover:bg-blue-100 py-2 px-2 rounded-xl text-blue-900 transition-all border border-blue-100 shadow-sm text-xs font-bold hover:scale-102 cursor-pointer truncate"
                        title={linkText}
                      >
                        <ExternalLink size={13} className="text-blue-600 shrink-0" />
                        <span className="truncate">{linkText}</span>
                      </a>
                    ) : (
                      <button 
                        disabled
                        className="flex items-center justify-center gap-1.5 bg-gray-50/70 py-2 px-2 rounded-xl text-gray-400 border border-gray-100 text-xs font-medium opacity-60 cursor-not-allowed"
                      >
                        Chưa có link
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* In-App Music indicator button */}
                    {char.youtubeMusicUrl ? (
                      <button 
                        onClick={() => handleOpenDetail(char)}
                        className="flex items-center justify-center gap-1.5 bg-pink-50/90 hover:bg-pink-100 py-1.5 px-2 rounded-xl text-pink-800 transition-all border border-pink-100 shadow-sm text-xs font-bold hover:scale-102 cursor-pointer"
                        title="Bật nhạc nền của bé (phát trực tiếp trong app)"
                      >
                        <Music size={13} className="text-pink-600" /> Nghe nhạc 🎵
                      </button>
                    ) : (
                      <div className="flex items-center justify-center text-[10px] text-gray-400 py-1.5 px-1 bg-white/40 rounded-xl">
                        Ko có nhạc
                      </div>
                    )}

                    {/* Feedback button */}
                    <button 
                      onClick={() => setFeedbackChar(char)} 
                      className="flex items-center justify-center gap-1.5 bg-white hover:bg-purple-50 py-1.5 px-2 rounded-xl text-purple-950 transition-all border border-purple-100 shadow-sm text-xs font-bold hover:scale-102 cursor-pointer"
                    >
                      <MessageSquare size={13} className="text-pink-500" /> Feedback
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <footer className="pt-10 pb-4 text-center space-y-2 border-t border-purple-200/50 mt-10">
        <div className="flex flex-wrap justify-center gap-2 text-xs text-purple-800 font-medium">
          <span className="bg-white/70 px-3 py-1 rounded-full border border-white shadow-sm">#MamNonRanCon</span>
          <span className="bg-white/70 px-3 py-1 rounded-full border border-white shadow-sm">#XaNuBatChong</span>
          <span className="bg-white/70 px-3 py-1 rounded-full border border-white shadow-sm">#CreatorPRCharacter</span>
        </div>
        <p className="text-xs text-purple-900/60 font-semibold">
          © 2026 Mầm Non Rắn Con 🌸 Thiết kế phong cách Aesthetic Anime Pastel 🍼
        </p>
      </footer>

      {/* --- MODALS --- */}

      {/* Character Detail Modal (Tuổi, Ngày sinh, Thích, Ghét, Story, In-App Music) */}
      {selectedDetailChar && (
        <CharacterDetailModal
          character={selectedDetailChar}
          onClose={() => setSelectedDetailChar(null)}
          onOpenFeedback={(char) => setFeedbackChar(char)}
          isAdmin={isAdmin}
          onEditCharacter={(char) => {
            setEditingChar(char);
            setShowFormModal(true);
          }}
        />
      )}

      {/* Add / Edit Character Form Modal */}
      {showFormModal && (
        <CharacterFormModal 
          onClose={() => setShowFormModal(false)}
          onSuccess={(updated) => onDataChange(updated)}
          characterToEdit={editingChar}
        />
      )}

      {/* Submit Anonymous Feedback Modal */}
      {feedbackChar && (
        <SubmitFeedbackModal 
          characterId={feedbackChar.id}
          characterName={feedbackChar.name}
          onClose={() => setFeedbackChar(null)}
        />
      )}

      {/* 18+ Age Verification Modal */}
      {pending18Char && (
        <AgeVerificationModal
          characterName={pending18Char.name}
          onConfirm={handleAgeVerifiedSuccess}
          onCancel={() => setPending18Char(null)}
        />
      )}

      {/* Delete Tag Confirmation Modal (Admin) */}
      {tagToDelete && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/65 backdrop-blur-md animate-fade-in" 
            onClick={() => !isDeletingTag && setTagToDelete(null)} 
          />
          <div className="bg-[#FFFBF5] rounded-[2.5rem] p-6 sm:p-7 max-w-sm w-full relative z-10 shadow-2xl border-4 border-red-200 text-center space-y-4 animate-in zoom-in-95 my-auto">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center text-3xl shadow-inner border-2 border-red-200">
              🏷️
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Xóa Tag Toàn Bộ?</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                Cô giáo có chắc muốn xóa tag <span className="font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">"{tagToDelete}"</span> khỏi tất cả các bé rắn trong lớp không?
              </p>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">
                🌸 Tag này sẽ được gỡ khỏi tất cả hồ sơ nhân vật ngay lập tức!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                disabled={isDeletingTag}
                onClick={() => setTagToDelete(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 font-bold text-gray-700 bg-white hover:bg-gray-100 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isDeletingTag}
                onClick={handleConfirmDeleteTag}
                className="w-full py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 font-black text-white shadow-md text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
              >
                {isDeletingTag ? (
                  <span className="animate-spin text-base">⏳</span>
                ) : (
                  <>
                    <Trash2 size={15} /> Xóa Tag
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Character Confirmation Modal */}
      {charToDelete && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/65 backdrop-blur-md animate-fade-in" 
            onClick={() => !isDeleting && setCharToDelete(null)} 
          />
          <div className="bg-[#FFFBF5] rounded-[2.5rem] p-6 sm:p-7 max-w-sm w-full relative z-10 shadow-2xl border-4 border-red-200 text-center space-y-4 animate-in zoom-in-95 my-auto">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center text-3xl shadow-inner border-2 border-red-200">
              🗑️
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Xác Nhận Xóa Bé Rắn?</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                Cô giáo có chắc muốn xóa bé <span className="font-extrabold text-red-600">"{charToDelete.name}"</span> khỏi lớp học không?
              </p>
              <p className="text-[11px] text-pink-600 font-semibold mt-1">
                🌸 Sau khi bấm xóa, bé sẽ biến mất khỏi danh sách ngay lập tức!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setCharToDelete(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 font-bold text-gray-700 bg-white hover:bg-gray-100 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-full py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 font-black text-white shadow-md text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="animate-spin text-base">⏳</span>
                ) : (
                  <>
                    <Trash2 size={15} /> Xóa Ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

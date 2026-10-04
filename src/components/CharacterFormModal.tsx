import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Upload, Music, ShieldAlert, Plus, Link, Cake, Calendar, Heart, HeartCrack, BookOpen } from 'lucide-react';
import { 
  Character, 
  addCharacter, 
  updateCharacter, 
  compressImageFile, 
  getAvailablePresetTags, 
  getAvailablePresetTagsSync, 
  deleteTagGlobally,
  registerTagsByAdmin
} from '../lib/data';
import { extractYouTubeId } from '../lib/youtube';
import { soundManager } from '../lib/audio';

interface CharacterFormModalProps {
  onClose: () => void;
  onSuccess: (updatedList?: Character[]) => void;
  characterToEdit?: Character | null;
}

export const CharacterFormModal: React.FC<CharacterFormModalProps> = ({ onClose, onSuccess, characterToEdit }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [birthday, setBirthday] = useState('');
  const [likes, setLikes] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [bio, setBio] = useState('');
  const [story, setStory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('Trò chuyện trên Google AI 🤖');
  const [youtubeMusicUrl, setYoutubeMusicUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [presetTags, setPresetTags] = useState<string[]>(() => getAvailablePresetTagsSync());
  const [customTagInput, setCustomTagInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  useEffect(() => {
    getAvailablePresetTags().then(loaded => {
      setPresetTags(loaded);
    });
  }, []);

  useEffect(() => {
    if (characterToEdit) {
      setName(characterToEdit.name || '');
      setAge(characterToEdit.age || '');
      setBirthday(characterToEdit.birthday || '');
      setLikes(characterToEdit.likes || '');
      setDislikes(characterToEdit.dislikes || '');
      setBio(characterToEdit.bio || '');
      setStory(characterToEdit.story || characterToEdit.plot || '');
      setImageUrl(characterToEdit.imageUrl || '');
      setLinkUrl(characterToEdit.linkUrl || characterToEdit.googleAiLink || '');
      setLinkLabel(characterToEdit.linkLabel || 'Trò chuyện trên Google AI 🤖');
      setYoutubeMusicUrl(characterToEdit.youtubeMusicUrl || '');
      setTags(characterToEdit.tags || (characterToEdit.is18Plus ? ['18+'] : []));
    }
  }, [characterToEdit]);

  const toggleTag = (tag: string) => {
    setFormError(null);
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleDeletePresetTagPermanently = async (tagToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playPop();
    setPresetTags(prev => prev.filter(t => t !== tagToRemove));
    setTags(prev => prev.filter(t => t !== tagToRemove));
    try {
      const updatedChars = await deleteTagGlobally(tagToRemove);
      onSuccess(updatedChars);
    } catch (err) {
      console.error("Error permanently deleting preset tag:", err);
    }
  };

  const handleAddCustomTag = async () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    if (!presetTags.includes(trimmed)) {
      setPresetTags(prev => [...prev, trimmed]);
    }
    setCustomTagInput('');
    await registerTagsByAdmin([trimmed]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setFormError("Ảnh tải lên quá lớn (tối đa 15MB). Vui lòng chọn ảnh nhẹ hơn hoặc dùng link URL ảnh.");
      return;
    }

    setFormError(null);
    setIsCompressingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 850, 0.8);
      setImageUrl(compressedDataUrl);
    } catch (err) {
      console.error("Image compression error:", err);
      setFormError("Không thể xử lý ảnh này, vui lòng thử ảnh khác.");
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !bio.trim()) {
      setFormError("Vui lòng điền tên nhân vật và giới thiệu ngắn!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const is18 = tags.some(t => ['18+', 'r18', 'h+', 'nsfw', '+18'].includes(t.toLowerCase().trim()));
      const charData = { 
        name: name.trim(), 
        age: age.trim(),
        birthday: birthday.trim(),
        likes: likes.trim(),
        dislikes: dislikes.trim(),
        bio: bio.trim(), 
        story: story.trim(), 
        plot: story.trim(),
        tags,
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim(),
        linkLabel: linkLabel.trim() || 'Link Bé Rắn ✨',
        googleAiLink: linkUrl.trim(),
        youtubeMusicUrl: youtubeMusicUrl.trim(),
        is18Plus: is18
      };

      let updatedList: Character[];
      if (characterToEdit) {
        updatedList = await updateCharacter(characterToEdit.id, charData);
      } else {
        updatedList = await addCharacter(charData);
      }
      soundManager.playSparkle();
      onSuccess(updatedList);
      onClose();
    } catch (error) {
      console.error(error);
      setFormError("Có lỗi xảy ra trong quá trình lưu, vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-[#FFFBF5] rounded-3xl p-5 sm:p-7 w-full max-w-xl my-auto relative z-10 shadow-2xl border border-purple-100 max-h-[82vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2.5 shadow-sm cursor-pointer z-10"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-center gap-2 mb-1 text-[#5e4373]">
          <Sparkles size={22} className="text-pink-500" />
          <h2 className="text-2xl font-bold">
            {characterToEdit ? 'Chỉnh Sửa Bé Rắn' : 'Thêm Bé Rắn Mới Vào Lớp'}
          </h2>
        </div>
        <p className="text-xs text-[#7e608a] mb-5">
          Mọi thông tin bạn sửa hoặc xóa (tên, ảnh, tuổi, sở thích, ghét, story, tag) sẽ tự động lưu vĩnh viễn cho tất cả mọi người truy cập.
        </p>

        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl animate-shake">
            ⚠️ {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {/* Vertical Portrait Image Upload & Preview */}
          <div className="bg-white p-4 rounded-2xl border border-purple-100 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
            <div className="relative w-24 h-32 rounded-2xl bg-gradient-to-tr from-[#EDE4FF] to-[#FFE8F7] p-1 shadow-2xs shrink-0 overflow-hidden flex items-center justify-center border border-purple-200">
              {imageUrl ? (
                <img src={imageUrl} alt="Preview ảnh dọc" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="text-center text-xs text-gray-400">
                  <span className="text-2xl block mb-1">🐍</span>
                  Ảnh dọc
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 w-full">
              <label className="block text-xs font-bold text-[#5e4373]">
                🖼️ Ảnh dọc nhân vật (Dán link URL hoặc Tải từ máy)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Dán link ảnh dọc (https://...)"
                className="w-full bg-[#FAF7FF] border border-purple-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-purple-300 text-gray-800"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex items-center gap-1.5 bg-[#EDE4FF] hover:bg-[#ded2fb] text-[#5e4373] text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer shadow-2xs transition-colors">
                  <Upload size={13} />
                  <span>{isCompressingImage ? 'Đang xử lý ảnh...' : 'Tải ảnh dọc từ máy...'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isCompressingImage} />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                  >
                    Xóa ảnh cũ
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#5e4373] mb-1">Tên nhân vật *</label>
              <input 
                required 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-white border border-purple-100 focus:border-[#C4B5FD] rounded-xl px-3.5 py-2 outline-none text-xs sm:text-sm text-gray-800" 
                placeholder="Ví dụ: Bạch Xà Vương Tử" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5e4373] mb-1 flex items-center gap-1">
                <Cake size={13} className="text-pink-500" /> Tuổi
              </label>
              <input 
                type="text" 
                value={age} 
                onChange={e => setAge(e.target.value)} 
                className="w-full bg-white border border-purple-100 focus:border-[#C4B5FD] rounded-xl px-3.5 py-2 outline-none text-xs sm:text-sm text-gray-800" 
                placeholder="Ví dụ: 5 tuổi, 18 tuổi, 24 tuổi..." 
              />
            </div>
          </div>

          {/* Birthday, Likes, Dislikes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#5e4373] mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-blue-500" /> Ngày sinh
              </label>
              <input 
                type="text" 
                value={birthday} 
                onChange={e => setBirthday(e.target.value)} 
                className="w-full bg-white border border-purple-100 focus:border-[#C4B5FD] rounded-xl px-3 py-2 outline-none text-xs text-gray-800" 
                placeholder="Ví dụ: 23/08, 15/10..." 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5e4373] mb-1 flex items-center gap-1">
                <Heart size={13} className="text-pink-500" /> Sở thích
              </label>
              <input 
                type="text" 
                value={likes} 
                onChange={e => setLikes(e.target.value)} 
                className="w-full bg-white border border-purple-100 focus:border-[#C4B5FD] rounded-xl px-3 py-2 outline-none text-xs text-gray-800" 
                placeholder="Ví dụ: Bánh dâu tây, ngủ nướng..." 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5e4373] mb-1 flex items-center gap-1">
                <HeartCrack size={13} className="text-red-400" /> Ghét
              </label>
              <input 
                type="text" 
                value={dislikes} 
                onChange={e => setDislikes(e.target.value)} 
                className="w-full bg-white border border-purple-100 focus:border-[#C4B5FD] rounded-xl px-3 py-2 outline-none text-xs text-gray-800" 
                placeholder="Ví dụ: Bị thức giấc, trời mưa..." 
              />
            </div>
          </div>

          {/* Story / Cốt truyện (Trọng tâm chính) & Bio phụ */}
          <div>
            <label className="block text-xs font-bold text-[#5e4373] mb-1 flex items-center gap-1">
              <BookOpen size={14} className="text-purple-600" /> 🌸 Story / Cốt truyện chi tiết của bé rắn *
            </label>
            <textarea 
              value={story} 
              onChange={e => setStory(e.target.value)} 
              className="w-full bg-white border border-purple-100 focus:border-[#C4B5FD] rounded-xl p-3.5 outline-none min-h-[140px] text-xs sm:text-sm text-gray-800 leading-relaxed shadow-inner" 
              placeholder="Nhập chi tiết cốt truyện, tương tác, bối cảnh và tình cảm ngọt ngào giữa bạn và bé rắn..." 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#7e608a] mb-1">
              Giới thiệu ngắn (Hiển thị trên thẻ ngoài lớp học) *
            </label>
            <input 
              type="text"
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              className="w-full bg-[#FAF7FF] border border-purple-100 focus:border-[#C4B5FD] rounded-xl px-3.5 py-2 outline-none text-xs text-gray-700" 
              placeholder="Câu nói đặc trưng hoặc lời tự sự ngắn của bé rắn..." 
            />
          </div>

          {/* Link URL & Custom Button Name (Tự admin sửa) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
            <div>
              <label className="block text-xs font-bold text-[#5e4373] mb-1 flex items-center gap-1">
                <Link size={13} className="text-blue-600" /> Link liên kết của bé rắn
              </label>
              <input 
                type="url" 
                value={linkUrl} 
                onChange={e => setLinkUrl(e.target.value)} 
                className="w-full bg-white border border-purple-200 focus:border-[#C4B5FD] rounded-xl px-3 py-2 outline-none text-xs text-gray-800" 
                placeholder="https://aistudio.google.com/... hoặc link truyện" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5e4373] mb-1 flex items-center gap-1">
                <span>🏷️</span> Tên nút hiển thị cho link (Admin tự sửa)
              </label>
              <input 
                type="text" 
                value={linkLabel} 
                onChange={e => setLinkLabel(e.target.value)} 
                className="w-full bg-white border border-purple-200 focus:border-[#C4B5FD] rounded-xl px-3 py-2 outline-none text-xs text-gray-800" 
                placeholder="Ví dụ: Trò chuyện trên Google AI 🤖" 
              />
            </div>
          </div>

          {/* YouTube Background Music (Tự động phát in-app khi ấn vào char) */}
          <div className="bg-[#FAF7FF] p-3 rounded-2xl border border-purple-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#5e4373] flex items-center gap-1">
                <Music size={14} className="text-pink-600" /> Link Nhạc nền YouTube (Tự động bật khi mở char)
              </label>
              {extractYouTubeId(youtubeMusicUrl) && (
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ Link hợp lệ (ID: {extractYouTubeId(youtubeMusicUrl)})
                </span>
              )}
            </div>
            <input 
              type="text" 
              value={youtubeMusicUrl} 
              onChange={e => setYoutubeMusicUrl(e.target.value)} 
              className="w-full bg-white border border-purple-200 focus:border-[#C4B5FD] rounded-xl px-3 py-2 outline-none text-xs text-gray-800" 
              placeholder="Dán link YouTube (https://www.youtube.com/watch?v=... hoặc bạn copy link chia sẻ)" 
            />
          </div>

          {/* Tag Selector */}
          <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#5e4373]">
                🏷️ Phân loại Tag của bé rắn
              </label>
              <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-md">
                Đã chọn: {tags.length} tag
              </span>
            </div>

            {/* Active Selected Tags with Quick Delete */}
            {tags.length > 0 && (
              <div className="p-2 bg-[#FAF7FF] rounded-xl border border-purple-100/70 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 block">Tag đang gắn cho bé này (Bấm × để gỡ khỏi bé):</span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => {
                    const is18 = ['18+', 'r18', 'h+', 'nsfw', '+18'].includes(tag.toLowerCase());
                    return (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.8 rounded-full border shadow-2xs ${
                          is18 
                            ? 'bg-red-500 text-white border-red-600' 
                            : 'bg-gradient-to-r from-[#DFD1FF] to-[#FFDEF9] text-[#5e4373] border-white'
                        }`}
                      >
                        <span>{is18 ? `🔞 ${tag}` : tag}</span>
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] cursor-pointer transition-transform hover:scale-115 ${
                            is18 ? 'bg-red-700 text-white' : 'bg-purple-900/20 hover:bg-purple-900 text-purple-950 hover:text-white'
                          }`}
                          title={`Gỡ tag "${tag}" khỏi bé này`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Preset Tags (Có thể xóa vĩnh viễn tag gợi ý ngay tại đây) */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 block">
                Danh sách Tag hệ thống (Bấm vào tên để chọn • Bấm dấu × đỏ để xóa vĩnh viễn tag khỏi toàn web):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetTags.map(tag => {
                  const isSelected = tags.includes(tag);
                  const is18 = tag === '18+';

                  return (
                    <div key={tag} className="relative inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`pl-2.5 pr-6 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? is18
                              ? 'bg-red-500 text-white border-red-500 shadow-2xs font-bold'
                              : 'bg-[#EDE4FF] text-[#5e4373] border-purple-300 shadow-2xs font-bold'
                            : is18
                              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                              : 'bg-[#FAF7FF] text-gray-600 border-purple-100 hover:bg-purple-50'
                        }`}
                      >
                        {is18 ? '🔞 18+' : tag}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePresetTagPermanently(tag, e)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center text-[9px] cursor-pointer transition-colors"
                        title={`Xóa vĩnh viễn tag "${tag}" khỏi toàn bộ trang web`}
                      >
                        <X size={9} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Tag Add */}
            <div className="flex gap-2 pt-1 border-t border-purple-50">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag(); } }}
                placeholder="Thêm tag mới..."
                className="bg-[#FAF7FF] border border-purple-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-purple-300 flex-1 max-w-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3.5 py-1.5 bg-[#EDE4FF] hover:bg-[#ded2fb] text-[#5e4373] text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus size={13} /> Thêm Tag Mới
              </button>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2 rounded-xl text-gray-500 font-medium hover:bg-gray-100 text-xs sm:text-sm cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || isCompressingImage} 
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#D8CEF6] to-[#FFE8F7] hover:from-[#cbbeee] hover:to-[#ffd5f3] text-[#5e4373] font-bold shadow-md border border-white disabled:opacity-50 text-xs sm:text-sm cursor-pointer transition-all hover:scale-102 active:scale-98"
            >
              {isSubmitting ? 'Đang lưu lên hệ thống...' : 'Lưu Thay Đổi Ngay ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

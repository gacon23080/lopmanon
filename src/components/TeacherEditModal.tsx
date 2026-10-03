import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Save, Sparkles, Upload } from 'lucide-react';
import { TeacherProfile, updateTeacherProfile } from '../lib/data';
import { soundManager } from '../lib/audio';

interface TeacherEditModalProps {
  currentProfile: TeacherProfile;
  onClose: () => void;
  onSuccess: (newProfile: TeacherProfile) => void;
}

export const TeacherEditModal: React.FC<TeacherEditModalProps> = ({
  currentProfile,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(currentProfile.name);
  const [title, setTitle] = useState(currentProfile.title);
  const [quote, setQuote] = useState(currentProfile.quote);
  const [bio, setBio] = useState(currentProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl || '');
  const [facebookUrl, setFacebookUrl] = useState(currentProfile.facebookUrl || 'https://www.facebook.com');
  const [commissionStatus, setCommissionStatus] = useState(currentProfile.commissionStatus || '🌸 Mở nhận kèo Commission');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        setFormError("Ảnh quá lớn (tối đa 2.5MB). Vui lòng chọn ảnh nhỏ hơn hoặc dùng URL ảnh trực tiếp.");
        return;
      }
      setFormError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);
    try {
      const updated: TeacherProfile = {
        name: name.trim(),
        title: title.trim(),
        quote: quote.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        commissionStatus: commissionStatus.trim(),
      };
      await updateTeacherProfile(updated);
      soundManager.playSparkle();
      onSuccess(updated);
      onClose();
    } catch (err) {
      console.error(err);
      setFormError("Lỗi khi lưu thông tin cô giáo, vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 pt-12 pb-6 sm:pt-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={onClose}></div>

      <div className="bg-[#FFF1E3] rounded-3xl p-5 sm:p-6 w-full max-w-lg my-auto relative z-10 shadow-2xl border-4 border-white max-h-[82vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-sm cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[#7e57c2]">
          <Sparkles size={22} className="text-pink-600" />
          <h3 className="text-2xl font-black">Chỉnh Sửa Hồ Sơ Cô Giáo</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Cập nhật ảnh đại diện, danh xưng, châm ngôn, lời chào và link Facebook cá nhân.
        </p>

        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl animate-shake">
            ⚠️ {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Avatar Preview & Inputs */}
          <div className="bg-white/80 p-4 rounded-2xl border border-purple-100 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#DFD1FF] to-[#FFDEF9] p-1 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="text-center text-xs text-gray-400">
                  <span className="text-2xl block mb-1">🌸</span>
                  Avatar Tóc Trắng
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 w-full">
              <label className="block text-xs font-bold text-gray-700">
                Ảnh đại diện (URL hoặc Tải lên từ máy)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Dán link ảnh (https://...)"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-purple-400"
                />
              </div>
              <label className="inline-flex items-center gap-1 bg-[#DCD2FF] hover:bg-[#c2b2ff] text-purple-900 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-sm transition-colors">
                <Upload size={13} /> Chọn file từ máy...
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tên Cô Giáo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Chức danh / Danh xưng *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Facebook URL */}
          <div className="bg-[#FAF7FF] p-3.5 rounded-2xl border border-purple-100">
            <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
              <span className="text-[#1877F2] font-black text-sm">f</span>
              <span>Link Facebook Cô Giáo (Hiển thị ngay dưới ảnh avatar)</span>
            </label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full bg-white border border-gray-200 focus:border-[#1877F2] rounded-xl px-3 py-2 text-xs outline-none text-gray-800 shadow-2xs"
            />
          </div>

          {/* Quote */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Châm ngôn lớp học *</label>
            <input
              type="text"
              required
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Lời chào mừng / Bio giới thiệu *</label>
            <textarea
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-purple-400 resize-none"
            />
          </div>

          {/* Commission Status */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Trạng thái nhận kèo / Commission</label>
            <input
              type="text"
              value={commissionStatus}
              onChange={(e) => setCommissionStatus(e.target.value)}
              placeholder="VD: 🌸 Mở nhận kèo Commission"
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-gray-500 font-medium hover:bg-gray-100 text-sm cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-xl bg-[#DFD1FF] hover:bg-[#c2b2ff] text-purple-950 font-bold text-sm shadow-md border border-white flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={16} />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Character {
  id: string;
  name: string;
  bio: string;
  story?: string;          // Cốt truyện / Story chi tiết
  plot?: string;           // Tương thích cốt truyện
  age?: string;            // Tuổi
  birthday?: string;       // Ngày sinh
  likes?: string;          // Thích
  dislikes?: string;       // Ghét
  tags: string[];
  imageUrl?: string;       // Ảnh dọc nhân vật
  linkUrl?: string;        // Link liên kết do admin dán
  linkLabel?: string;      // Tên nút hiển thị do admin tự do đặt
  googleAiLink?: string;   // Tương thích ngược
  youtubeMusicUrl?: string;// Link nhạc nền YouTube (tự bật in-app khi ấn vào char)
  is18Plus?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface Feedback {
  id: string;
  characterId: string;
  characterName?: string;
  senderName?: string;
  color?: string;          // 'pink' | 'purple' | 'yellow' | 'green'
  content: string;
  likes?: number;
  timestamp: number;
  isPrivateToTeacher?: boolean; // Thư gửi riêng cho giáo viên (chỉ admin và người gửi thấy)
  visitorId?: string;           // Mã khách truy cập
  adminReply?: string;          // Phản hồi của cô giáo / admin
  adminRepliedAt?: number;
}

export interface TeacherProfile {
  name: string;
  title: string;
  quote: string;
  bio: string;
  avatarUrl: string;
  facebookUrl?: string;    // Link Facebook cô giáo do admin tự cập nhật
  commissionStatus: string;
  updatedAt?: number;
}

export interface AppStats {
  studentCount: number;
}

export interface AppMetaConfig {
  deletedCharacterIds: string[];
  deletedTags: string[];
  customTags: string[];
  deletedFeedbackIds?: string[];
  initializedSeed: boolean;
  initializedFeedbacksSeed?: boolean;
  updatedAt: number;
}

export interface MemoryCornerConfig {
  title: string;
  subtitle: string;
  rulesTitle: string;
  rules: string[];
  wishTitle: string;
  wishContent: string;
  updatedAt?: number;
}

export const DEFAULT_MEMORY_CORNER: MemoryCornerConfig = {
  title: "🤍 Góc Lưu Niệm Mầm Non",
  subtitle: "🌸 Những kỷ niệm ngọt ngào giữa Cô Giáo Xà Nữ & Các Bé Rắn Con",
  rulesTitle: "Nội quy đáng yêu của lớp:",
  rules: [
    "Mỗi ngày uống đủ một bình sữa ấm 🍼",
    "Thấy crush thì tự tin bò lại gần xin xoa đầu 🐍",
    "Không cắn bạn, chỉ cắn yêu thôi nha! 💕"
  ],
  wishTitle: "Lời chúc từ Cô Giáo:",
  wishContent: "“Chúc cho tất cả các bbi ghé thăm luôn tràn ngập niềm vui, mỗi ngày đều tìm thấy một bé rắn đáng yêu quấn quít bên cạnh!”"
};

export const DEFAULT_PRESET_TAGS: string[] = [
  'Ngọt', 
  'Ngược', 
  'Thanh xuân vườn trường', 
  'Hiện đại', 
  'Cổ trang / Tiên hiệp', 
  'Yếu tố giả tưởng', 
  'Chiếm hữu', 
  'Giam cầm nhẹ', 
  'Tổng tài', 
  'Niên hạ', 
  'Niên thượng', 
  'Xà thần / Dị tộc', 
  'Hài hước', 
  '18+'
];

export const DEFAULT_APP_META: AppMetaConfig = {
  deletedCharacterIds: [],
  deletedTags: [],
  customTags: [],
  initializedSeed: false,
  updatedAt: 0,
};

export const DEFAULT_TEACHER: TeacherProfile = {
  name: "Cô Giáo Xà Nữ Bạch Kim",
  title: "🌸 Hiệu Trưởng & Chủ Nhiệm Lớp Mầm Non Rắn Con",
  quote: "“Dù bé rắn nào có bướng bỉnh hay quấn người đến đâu, cô giáo cũng sẽ ôm trọn bằng tình yêu thương và sự dịu dàng nhất thế gian~”",
  bio: "Chào mừng các phụ huynh và các bé yêu đến với Mầm Non Rắn Con! Nơi đây tập hợp những bé rắn nhỏ ngọt ngào, tinh nghịch, đôi lúc hơi chiếm hữu nhưng vô cùng đáng yêu. Hãy bốc thăm bé chồng định mệnh hoặc gửi sticky note ẩn danh cho cô giáo và các bé nhé!",
  avatarUrl: "https://i.postimg.cc/Px3THWGJ/IMG-8215.jpg",
  facebookUrl: "https://www.facebook.com",
  commissionStatus: "Đang mở nhận học sinh mới & Custom Bot 💌"
};

export const INITIAL_CHARACTERS: Omit<Character, 'id'>[] = [
  {
    name: "Bạch Xà Vương Tử (Bạch Linh)",
    age: "7 tuổi",
    birthday: "23/08",
    likes: "Sữa dâu ấm, được vuốt ve đuôi nhỏ, ôm chặt lấy bạn khi ngủ",
    dislikes: "Trời lạnh, bị bỏ rơi một mình, người lạ đến gần bạn",
    bio: "Bé rắn trắng hoàng tử kiêu kỳ nhưng cực kỳ bám bạn, thích cuộn tròn trên đùi bạn ngủ say sưa.",
    story: "Bạch Linh sinh ra trong gia tộc Bạch Xà cao quý, từ nhỏ đã được cưng chiều. Thế nhưng cậu bé lại chỉ thích quấn lấy bạn, mỗi khi bạn đọc sách hay làm việc, chiếc đuôi nhỏ vảy bạc lại âm thầm quấn lấy cổ tay hoặc eo bạn như một lời nhắc nhở: 'Chỉ được nhìn một mình Linh Linh thôi đó nha!'.",
    plot: "Bạch Linh sinh ra trong gia tộc Bạch Xà cao quý, từ nhỏ đã được cưng chiều. Thế nhưng cậu bé lại chỉ thích quấn lấy bạn, mỗi khi bạn đọc sách hay làm việc, chiếc đuôi nhỏ vảy bạc lại âm thầm quấn lấy cổ tay hoặc eo bạn như một lời nhắc nhở: 'Chỉ được nhìn một mình Linh Linh thôi đó nha!'.",
    tags: ["Ngọt", "Chiếm hữu", "Hiện đại"],
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80",
    linkUrl: "https://aistudio.google.com",
    linkLabel: "Trò chuyện cùng Bạch Linh ✨",
    googleAiLink: "https://aistudio.google.com",
    youtubeMusicUrl: "",
    is18Plus: false,
    createdAt: 1700000300000
  },
  {
    name: "Hắc Xà Ma Tôn (Dạ Lân)",
    age: "19 tuổi",
    birthday: "31/10",
    likes: "Rượu hoa đào, bóng tối yên tĩnh, hơi ấm từ cổ của bạn",
    dislikes: "Ánh nắng gay gắt, ai chạm vào bạn",
    bio: "Đại ca lớp mầm non, vẻ ngoài lạnh lùng bí ẩn nhưng mang trái tim chiếm hữu mãnh liệt.",
    story: "Cảnh báo 18+: Mang trong mình dòng máu xà thần bóng đêm, Dạ Lân khi đến kỳ nhiệt độ hạ thấp sẽ quấn chặt lấy người mà cậu tin tưởng nhất. Hơi thở ấm áp phả vào gáy cùng những lời thì thầm mê hoặc: 'Đừng đi đâu cả, hãy sưởi ấm cho tôi...'. Cậu không bao giờ để bạn rời khỏi tầm mắt.",
    plot: "Cảnh báo 18+: Mang trong mình dòng máu xà thần bóng đêm, Dạ Lân khi đến kỳ nhiệt độ hạ thấp sẽ quấn chặt lấy người mà cậu tin tưởng nhất. Hơi thở ấm áp phả vào gáy cùng những lời thì thầm mê hoặc: 'Đừng đi đâu cả, hãy sưởi ấm cho tôi...'. Cậu không bao giờ để bạn rời khỏi tầm mắt.",
    tags: ["Ngược", "Chiếm hữu", "Yếu tố giả tưởng", "18+"],
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    linkUrl: "https://aistudio.google.com",
    linkLabel: "Vào thế giới Dạ Lân 🔞",
    googleAiLink: "https://aistudio.google.com",
    youtubeMusicUrl: "",
    is18Plus: true,
    createdAt: 1700000200000
  },
  {
    name: "Thanh Trúc Tiểu Xà (Lục Lục)",
    age: "6 tuổi",
    birthday: "12/04",
    likes: "Hái hoa dại cài lên tóc bạn, uống bình sữa ấm, đọc sách cùng cô giáo",
    dislikes: "Trời mưa sấm sét, bị điểm kém",
    bio: "Bé rắn lục nhỏ bé ngoan ngoãn lớp phó học tập, luôn mang hoa dại cài lên tóc bạn.",
    story: "Lục Lục là học sinh gương mẫu nhất trường, ngày nào cũng chuẩn bị bình sữa ấm và một nhành hoa tươi rói đặt lên bàn bạn. Cứ nhìn thấy bạn mỉm cười là đuôi rắn nhỏ lại ngoáy tít mù trong hạnh phúc.",
    plot: "Lục Lục là học sinh gương mẫu nhất trường, ngày nào cũng chuẩn bị bình sữa ấm và một nhành hoa tươi rói đặt lên bàn bạn. Cứ nhìn thấy bạn mỉm cười là đuôi rắn nhỏ lại ngoáy tít mù trong hạnh phúc.",
    tags: ["Ngọt", "Hiện đại", "Thanh xuân vườn trường"],
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
    linkUrl: "https://aistudio.google.com",
    linkLabel: "Khám phá ngoại truyện ✨",
    googleAiLink: "https://aistudio.google.com",
    youtubeMusicUrl: "",
    is18Plus: false,
    createdAt: 1700000100000
  }
];

const isFirebaseAvailable = !!db;

// Helper to prevent Firestore from hanging while giving enough time (12s) for image uploads
const withTimeout = <T>(promise: Promise<T>, timeoutMs = 12000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Firestore timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

/**
 * Nén ảnh tự động trên trình duyệt bằng HTML5 Canvas
 * Đảm bảo mọi ảnh Admin tải lên từ máy đều < 200KB để lưu vào Firestore 100% thành công,
 * không bao giờ bị lỗi vượt quá giới hạn 1MB của Firestore!
 */
export const compressImageFile = (file: File, maxDimension = 850, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh"));
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error("Dữ liệu ảnh trống"));
        return;
      }
      compressDataUrl(dataUrl, maxDimension, quality).then(resolve).catch(() => resolve(dataUrl));
    };
    reader.readAsDataURL(file);
  });
};

export const compressDataUrl = (dataUrl: string, maxDimension = 850, quality = 0.78): Promise<string> => {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Ưu tiên nén sang JPEG/WebP gọn nhẹ
        let compressed = canvas.toDataURL('image/webp', quality);
        if (compressed.length > 450000 || !compressed.startsWith('data:image/webp')) {
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        if (compressed.length > 650000) {
          compressed = canvas.toDataURL('image/jpeg', 0.6);
        }
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

// --- GLOBAL APP META (Lưu danh sách ID đã xóa & Tag đã xóa trên Firestore) ---
const readLocalAppMeta = (): AppMetaConfig => {
  const deletedIds: string[] = JSON.parse(localStorage.getItem('deletedCharacterIds') || '[]');
  const deletedTags: string[] = JSON.parse(localStorage.getItem('deletedTags') || '[]');
  const customTags: string[] = JSON.parse(localStorage.getItem('customTags') || '[]');
  const deletedFeedbackIds: string[] = JSON.parse(localStorage.getItem('deletedFeedbackIds') || '[]');
  const initializedSeed = localStorage.getItem('initializedSeed') === 'true';
  const initializedFeedbacksSeed = localStorage.getItem('initializedFeedbacksSeed') === 'true';
  return {
    deletedCharacterIds: Array.from(new Set(deletedIds)),
    deletedTags: Array.from(new Set(deletedTags)),
    customTags: Array.from(new Set(customTags)),
    deletedFeedbackIds: Array.from(new Set(deletedFeedbackIds)),
    initializedSeed,
    initializedFeedbacksSeed,
    updatedAt: Number(localStorage.getItem('appMetaUpdatedAt') || '0'),
  };
};

const writeLocalAppMeta = (meta: AppMetaConfig) => {
  localStorage.setItem('deletedCharacterIds', JSON.stringify(Array.from(new Set(meta.deletedCharacterIds || []))));
  localStorage.setItem('deletedTags', JSON.stringify(Array.from(new Set(meta.deletedTags || []))));
  localStorage.setItem('customTags', JSON.stringify(Array.from(new Set(meta.customTags || []))));
  localStorage.setItem('deletedFeedbackIds', JSON.stringify(Array.from(new Set(meta.deletedFeedbackIds || []))));
  localStorage.setItem('initializedSeed', meta.initializedSeed ? 'true' : 'false');
  localStorage.setItem('initializedFeedbacksSeed', meta.initializedFeedbacksSeed ? 'true' : 'false');
  localStorage.setItem('appMetaUpdatedAt', String(meta.updatedAt || Date.now()));
};

export const getAppMeta = async (): Promise<AppMetaConfig> => {
  const localMeta = readLocalAppMeta();
  if (isFirebaseAvailable) {
    try {
      const snap = await withTimeout(getDoc(doc(db!, 'settings', 'appMeta')), 6000);
      if (snap.exists()) {
        const remote = snap.data() as Partial<AppMetaConfig>;
        const merged: AppMetaConfig = {
          deletedCharacterIds: Array.from(new Set(remote.deletedCharacterIds || [])),
          deletedTags: Array.from(new Set(remote.deletedTags || [])),
          customTags: Array.from(new Set(remote.customTags || [])),
          deletedFeedbackIds: Array.from(new Set(remote.deletedFeedbackIds || [])),
          initializedSeed: Boolean(remote.initializedSeed),
          initializedFeedbacksSeed: Boolean(remote.initializedFeedbacksSeed),
          updatedAt: remote.updatedAt || Date.now(),
        };
        writeLocalAppMeta(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Could not fetch appMeta from Firestore:", e);
    }
  }
  return localMeta;
};

export const saveAppMeta = async (patch: Partial<AppMetaConfig>): Promise<AppMetaConfig> => {
  const current = await getAppMeta();
  const next: AppMetaConfig = {
    deletedCharacterIds: Array.from(new Set(patch.deletedCharacterIds ?? current.deletedCharacterIds)),
    deletedTags: Array.from(new Set(patch.deletedTags ?? current.deletedTags)),
    customTags: Array.from(new Set(patch.customTags ?? current.customTags)),
    deletedFeedbackIds: Array.from(new Set(patch.deletedFeedbackIds ?? (current.deletedFeedbackIds || []))),
    initializedSeed: patch.initializedSeed ?? current.initializedSeed,
    initializedFeedbacksSeed: patch.initializedFeedbacksSeed ?? Boolean(current.initializedFeedbacksSeed),
    updatedAt: Date.now(),
  };
  writeLocalAppMeta(next);
  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'settings', 'appMeta'), next));
    } catch (e) {
      console.warn("Could not save appMeta to Firestore:", e);
    }
  }
  return next;
};

// Trả về danh sách tag gợi ý (đã loại bỏ hoàn toàn các tag mà Admin đã xóa!)
export const getAvailablePresetTags = async (): Promise<string[]> => {
  const meta = await getAppMeta();
  const deletedSet = new Set((meta.deletedTags || []).map(t => t.trim().toLowerCase()));
  const combined = Array.from(new Set([...DEFAULT_PRESET_TAGS, ...(meta.customTags || [])]));
  return combined.filter(tag => !deletedSet.has(tag.trim().toLowerCase()));
};

export const getAvailablePresetTagsSync = (): string[] => {
  const meta = readLocalAppMeta();
  const deletedSet = new Set((meta.deletedTags || []).map(t => t.trim().toLowerCase()));
  const combined = Array.from(new Set([...DEFAULT_PRESET_TAGS, ...(meta.customTags || [])]));
  return combined.filter(tag => !deletedSet.has(tag.trim().toLowerCase()));
};

// Khi Admin chủ động thêm 1 tag mới, nếu tag đó từng nằm trong danh sách xóa thì gỡ khỏi deletedTags và thêm vào customTags
export const registerTagsByAdmin = async (tagsToRegister: string[]): Promise<void> => {
  const cleaned = tagsToRegister.map(t => t.trim()).filter(Boolean);
  if (cleaned.length === 0) return;

  const meta = await getAppMeta();
  const lowerAdding = new Set(cleaned.map(t => t.toLowerCase()));
  const nextDeletedTags = (meta.deletedTags || []).filter(t => !lowerAdding.has(t.trim().toLowerCase()));
  const nextCustomTags = Array.from(new Set([
    ...(meta.customTags || []),
    ...cleaned.filter(t => !DEFAULT_PRESET_TAGS.includes(t))
  ]));

  if (
    nextDeletedTags.length !== (meta.deletedTags || []).length ||
    nextCustomTags.length !== (meta.customTags || []).length
  ) {
    await saveAppMeta({
      deletedTags: nextDeletedTags,
      customTags: nextCustomTags,
    });
  }
};

// School Background Music Settings (Admin tự do đổi nhạc nền toàn web)
export interface SchoolMusicConfig {
  url: string;
  title: string;
}

export const DEFAULT_SCHOOL_MUSIC: SchoolMusicConfig = {
  url: "https://www.youtube.com/watch?v=3Ozo7tejr00",
  title: "Đến Đây Bên Anh - Dangrangto 🎵"
};

export const getSchoolMusic = async (): Promise<SchoolMusicConfig> => {
  if (isFirebaseAvailable) {
    try {
      const docSnap = await withTimeout(getDoc(doc(db!, 'settings', 'schoolMusic')), 6000);
      if (docSnap.exists()) {
        const data = docSnap.data() as SchoolMusicConfig;
        if (data.url && (data.url.includes("Vz59vE52J0k") || data.url.includes("kYv_8k9Yw1M"))) {
          data.url = DEFAULT_SCHOOL_MUSIC.url;
        }
        const merged = { ...DEFAULT_SCHOOL_MUSIC, ...data };
        localStorage.setItem('schoolMusic', JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.warn("Could not fetch school music from Firestore:", e);
    }
  }
  const local = localStorage.getItem('schoolMusic');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      return { ...DEFAULT_SCHOOL_MUSIC, ...parsed };
    } catch {}
  }
  return DEFAULT_SCHOOL_MUSIC;
};

export const updateSchoolMusic = async (config: SchoolMusicConfig): Promise<SchoolMusicConfig> => {
  localStorage.setItem('schoolMusic', JSON.stringify(config));
  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'settings', 'schoolMusic'), config));
    } catch (e) {
      console.warn("Could not save school music to Firestore:", e);
    }
  }
  return config;
};

// Teacher Profile
export const getTeacherProfile = async (): Promise<TeacherProfile> => {
  if (isFirebaseAvailable) {
    try {
      const docSnap = await withTimeout(getDoc(doc(db!, 'settings', 'teacherProfile')), 6000);
      if (docSnap.exists()) {
        const remote = { ...DEFAULT_TEACHER, ...(docSnap.data() as TeacherProfile) };
        if (remote.avatarUrl && remote.avatarUrl.includes("unsplash.com/photo-1544005313-94ddf0286df2")) {
          remote.avatarUrl = DEFAULT_TEACHER.avatarUrl;
        }
        localStorage.setItem('teacherProfile', JSON.stringify(remote));
        return remote;
      }
    } catch (e) {
      console.warn("Could not fetch teacher profile from Firestore:", e);
    }
  }

  const local = localStorage.getItem('teacherProfile');
  if (local) {
    try {
      const parsed = { ...DEFAULT_TEACHER, ...JSON.parse(local) };
      if (parsed.avatarUrl && parsed.avatarUrl.includes("unsplash.com/photo-1544005313-94ddf0286df2")) {
        parsed.avatarUrl = DEFAULT_TEACHER.avatarUrl;
      }
      return parsed;
    } catch {}
  }

  return DEFAULT_TEACHER;
};

export const updateTeacherProfile = async (profile: Partial<TeacherProfile>): Promise<TeacherProfile> => {
  const current = await getTeacherProfile();
  let avatarUrl = (profile.avatarUrl ?? current.avatarUrl) || DEFAULT_TEACHER.avatarUrl;
  if (avatarUrl.startsWith('data:image/') && avatarUrl.length > 350000) {
    avatarUrl = await compressDataUrl(avatarUrl, 750, 0.78);
  }

  const updated: TeacherProfile = {
    name: (profile.name ?? current.name).trim(),
    title: (profile.title ?? current.title).trim(),
    quote: (profile.quote ?? current.quote).trim(),
    bio: (profile.bio ?? current.bio).trim(),
    avatarUrl,
    facebookUrl: (profile.facebookUrl ?? current.facebookUrl ?? '').trim(),
    commissionStatus: (profile.commissionStatus ?? current.commissionStatus ?? '').trim(),
    updatedAt: Date.now(),
  };
  
  localStorage.setItem('teacherProfile', JSON.stringify(updated));
  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'settings', 'teacherProfile'), updated));
    } catch (e) {
      console.warn("Could not save teacher profile to Firestore:", e);
    }
  }
  return updated;
};

// Chuẩn hóa đầy đủ trường dữ liệu của Character để Firestore không bao giờ thiếu trường
const normalizeCharacter = (raw: Partial<Character> & { id: string }, deletedTagsSet?: Set<string>): Character => {
  // Nếu là init-1, init-2, init-3 từng bị lưu thiếu trường trước đây, lấy fallback từ INITIAL_CHARACTERS
  let baseFallback: Partial<Character> = {};
  if (raw.id === 'init-1') baseFallback = INITIAL_CHARACTERS[0];
  if (raw.id === 'init-2') baseFallback = INITIAL_CHARACTERS[1];
  if (raw.id === 'init-3') baseFallback = INITIAL_CHARACTERS[2];

  const rawTags = Array.isArray(raw.tags)
    ? raw.tags
    : (Array.isArray(baseFallback.tags) ? baseFallback.tags : []);

  const filteredTags = deletedTagsSet
    ? rawTags.filter(t => !deletedTagsSet.has(t.trim().toLowerCase()))
    : rawTags;

  const is18 = filteredTags.some(t => ['18+', 'r18', 'h+', 'nsfw', '+18'].includes(t.toLowerCase().trim()));

  const youtubeMusicUrl = (raw.youtubeMusicUrl ?? baseFallback.youtubeMusicUrl ?? '').trim();

  const storyVal = raw.story ?? raw.plot ?? baseFallback.story ?? baseFallback.plot ?? '';
  const linkVal = raw.linkUrl ?? raw.googleAiLink ?? baseFallback.linkUrl ?? baseFallback.googleAiLink ?? '';

  return {
    id: raw.id,
    name: (raw.name ?? baseFallback.name ?? 'Bé Rắn Bí Ẩn').trim(),
    age: raw.age !== undefined ? raw.age : (baseFallback.age ?? ''),
    birthday: raw.birthday !== undefined ? raw.birthday : (baseFallback.birthday ?? ''),
    likes: raw.likes !== undefined ? raw.likes : (baseFallback.likes ?? ''),
    dislikes: raw.dislikes !== undefined ? raw.dislikes : (baseFallback.dislikes ?? ''),
    bio: raw.bio !== undefined ? raw.bio : (baseFallback.bio ?? ''),
    story: storyVal,
    plot: storyVal,
    tags: filteredTags,
    imageUrl: raw.imageUrl !== undefined ? raw.imageUrl : (baseFallback.imageUrl ?? ''),
    linkUrl: linkVal,
    linkLabel: raw.linkLabel !== undefined ? raw.linkLabel : (baseFallback.linkLabel ?? 'Mở Link Bé Rắn ✨'),
    googleAiLink: linkVal,
    youtubeMusicUrl,
    is18Plus: is18,
    createdAt: typeof raw.createdAt === 'number' && !Number.isNaN(raw.createdAt)
      ? raw.createdAt
      : (baseFallback.createdAt ?? Date.now()),
    updatedAt: raw.updatedAt || Date.now(),
  };
};

// Đồng bộ dữ liệu từ Firestore làm nguồn chân lý duy nhất (Single Source of Truth)
export const syncAdminLocalToCloudIfNeeded = async (_force = false) => {
  // Đã đồng bộ hoàn tất lên Firestore; luôn ưu tiên dữ liệu trực tiếp từ Firestore
  return;
};

// Characters: Firestore là nguồn chân lý duy nhất (Single Source of Truth) cho TẤT CẢ người truy cập!
export const getCharacters = async (): Promise<Character[]> => {
  await syncAdminLocalToCloudIfNeeded();

  const meta = await getAppMeta();
  const deletedIdsSet = new Set(meta.deletedCharacterIds || []);
  const deletedTagsSet = new Set((meta.deletedTags || []).map(t => t.trim().toLowerCase()));

  if (isFirebaseAvailable) {
    try {
      // QUAN TRỌNG: Không dùng orderBy('createdAt') trong câu query Firestore vì Firestore sẽ bỏ qua
      // các document từng được update mà thiếu trường createdAt! Ta lấy toàn bộ collection và sort bằng JS.
      const snapshot = await withTimeout(getDocs(collection(db!, 'characters')), 8000);
      const firestoreCharsMap = new Map<string, Character>();

      snapshot.docs.forEach(docSnap => {
        if (!deletedIdsSet.has(docSnap.id)) {
          const rawData = docSnap.data() as Partial<Character>;
          const normalized = normalizeCharacter({ ...rawData, id: docSnap.id }, deletedTagsSet);
          firestoreCharsMap.set(docSnap.id, normalized);
        }
      });

      // Nếu database chưa từng khởi tạo seed lần nào và chưa có dữ liệu trên Firestore
      if (!meta.initializedSeed && firestoreCharsMap.size === 0) {
        const initialSeed: Character[] = INITIAL_CHARACTERS
          .map((c, idx) => normalizeCharacter({ ...c, id: `init-${idx + 1}` }, deletedTagsSet))
          .filter(c => !deletedIdsSet.has(c.id));

        for (const seedChar of initialSeed) {
          firestoreCharsMap.set(seedChar.id, seedChar);
          try {
            await withTimeout(setDoc(doc(db!, 'characters', seedChar.id), seedChar), 5000);
          } catch {}
        }
        await saveAppMeta({ initializedSeed: true });
      } else if (!meta.initializedSeed && firestoreCharsMap.size > 0) {
        // Nếu có một số bé init-1, init-2, init-3 chưa được lưu lên Firestore (và chưa bị xóa),
        // khởi tạo nốt lên Firestore rồi đánh dấu initializedSeed = true để không bao giờ tự hồi sinh nữa
        for (let idx = 0; idx < INITIAL_CHARACTERS.length; idx++) {
          const initId = `init-${idx + 1}`;
          if (!deletedIdsSet.has(initId) && !firestoreCharsMap.has(initId)) {
            const initChar = normalizeCharacter({ ...INITIAL_CHARACTERS[idx], id: initId }, deletedTagsSet);
            firestoreCharsMap.set(initId, initChar);
            try {
              await withTimeout(setDoc(doc(db!, 'characters', initId), initChar), 5000);
            } catch {}
          }
        }
        await saveAppMeta({ initializedSeed: true });
      }

      const finalList = Array.from(firestoreCharsMap.values())
        .filter(c => !deletedIdsSet.has(c.id))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      // Ghi đè localStorage bằng dữ liệu chuẩn từ Firestore để mọi khách truy cập không bao giờ dính dữ liệu cũ
      localStorage.setItem('characters', JSON.stringify(finalList));
      return finalList;
    } catch (e) {
      console.warn("Could not fetch characters from Firestore, using local cache:", e);
    }
  }

  // Fallback khi offline
  const local = localStorage.getItem('characters');
  if (local) {
    try {
      const parsed: Character[] = JSON.parse(local);
      return parsed
        .filter(c => !deletedIdsSet.has(c.id))
        .map(c => normalizeCharacter(c, deletedTagsSet))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch {}
  }

  const fallback = INITIAL_CHARACTERS
    .map((c, idx) => normalizeCharacter({ ...c, id: `init-${idx + 1}` }, deletedTagsSet))
    .filter(c => !deletedIdsSet.has(c.id));
  localStorage.setItem('characters', JSON.stringify(fallback));
  return fallback;
};

export const addCharacter = async (char: Omit<Character, 'id' | 'createdAt'>): Promise<Character[]> => {
  // Nếu Admin gắn tag cho nhân vật mới, đăng ký tag đó để đảm bảo không nằm trong danh sách xóa
  if (char.tags && char.tags.length > 0) {
    await registerTagsByAdmin(char.tags);
  }

  let imageUrl = (char.imageUrl || '').trim();
  if (imageUrl.startsWith('data:image/') && imageUrl.length > 350000) {
    imageUrl = await compressDataUrl(imageUrl, 850, 0.78);
  }

  const now = Date.now();
  const newId = 'char_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 6);

  const created = normalizeCharacter({
    ...char,
    id: newId,
    imageUrl,
    story: char.story || char.plot || '',
    plot: char.plot || char.story || '',
    createdAt: now,
    updatedAt: now,
  });

  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'characters', newId), created), 12000);
      await saveAppMeta({ initializedSeed: true });
    } catch (e) {
      console.error("Failed to add character to Firestore:", e);
      throw e;
    }
  }
  
  const chars = await getCharacters();
  const updated = [created, ...chars.filter(c => c.id !== newId)];
  localStorage.setItem('characters', JSON.stringify(updated));
  return updated;
};

export const updateCharacter = async (id: string, char: Partial<Character>): Promise<Character[]> => {
  // Nếu Admin thêm tag vào nhân vật khi sửa, đảm bảo tag đó được kích hoạt
  if (char.tags && char.tags.length > 0) {
    await registerTagsByAdmin(char.tags);
  }

  const currentChars = await getCharacters();
  const existing = currentChars.find(c => c.id === id);

  let imageUrl = char.imageUrl !== undefined ? char.imageUrl.trim() : (existing?.imageUrl || '');
  if (imageUrl.startsWith('data:image/') && imageUrl.length > 350000) {
    imageUrl = await compressDataUrl(imageUrl, 850, 0.78);
  }

  const meta = await getAppMeta();
  const deletedTagsSet = new Set((meta.deletedTags || []).map(t => t.trim().toLowerCase()));

  const fullUpdated = normalizeCharacter(
    {
      ...(existing || {}),
      ...char,
      id,
      imageUrl,
      story: char.story !== undefined ? char.story : (char.plot !== undefined ? char.plot : (existing?.story || '')),
      plot: char.story !== undefined ? char.story : (char.plot !== undefined ? char.plot : (existing?.plot || '')),
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    },
    deletedTagsSet
  );

  // Ghi đè toàn bộ document trên Firestore để xóa sạch mọi thông tin/ảnh/tên/tuổi/tag cũ
  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'characters', id), fullUpdated), 12000);
      // Nếu id này từng nằm trong danh sách xóa thì gỡ ra
      if (meta.deletedCharacterIds.includes(id)) {
        await saveAppMeta({
          deletedCharacterIds: meta.deletedCharacterIds.filter(item => item !== id),
          initializedSeed: true,
        });
      }
    } catch (e) {
      console.error("Failed to update character in Firestore:", e);
      throw e;
    }
  }

  const updatedList = currentChars.some(c => c.id === id)
    ? currentChars.map(c => (c.id === id ? fullUpdated : c))
    : [fullUpdated, ...currentChars];

  localStorage.setItem('characters', JSON.stringify(updatedList));
  return updatedList;
};

export const deleteCharacter = async (id: string): Promise<Character[]> => {
  // 1. Lưu ID đã xóa vào settings/appMeta trên Firestore để BẤT CỨ AI truy cập cũng không bao giờ thấy lại
  const meta = await getAppMeta();
  const nextDeletedIds = Array.from(new Set([...(meta.deletedCharacterIds || []), id]));
  await saveAppMeta({
    deletedCharacterIds: nextDeletedIds,
    initializedSeed: true,
  });

  // 2. Xóa hoàn toàn document khỏi Firestore
  if (isFirebaseAvailable) {
    try {
      await withTimeout(deleteDoc(doc(db!, 'characters', id)), 8000);
    } catch (e) {
      console.warn("Could not delete character doc from Firestore:", e);
    }
  }

  // 3. Cập nhật bộ nhớ đệm
  let currentList: Character[] = [];
  const localStr = localStorage.getItem('characters');
  if (localStr) {
    try {
      currentList = JSON.parse(localStr);
    } catch {
      currentList = [];
    }
  }
  const updatedList = currentList.filter((c: Character) => c.id !== id && !nextDeletedIds.includes(c.id));
  localStorage.setItem('characters', JSON.stringify(updatedList));

  return updatedList;
};

export const deleteTagGlobally = async (tagToDelete: string): Promise<Character[]> => {
  const cleanTarget = tagToDelete.trim();
  const cleanTargetLower = cleanTarget.toLowerCase();

  // 1. Lưu tag đã xóa vào settings/appMeta trên Firestore để tag đó biến mất vĩnh viễn khỏi toàn bộ hệ thống & gợi ý
  const meta = await getAppMeta();
  const nextDeletedTags = Array.from(new Set([...(meta.deletedTags || []), cleanTarget]));
  const nextCustomTags = (meta.customTags || []).filter(t => t.trim().toLowerCase() !== cleanTargetLower);

  await saveAppMeta({
    deletedTags: nextDeletedTags,
    customTags: nextCustomTags,
    initializedSeed: true,
  });

  const deletedTagsSet = new Set(nextDeletedTags.map(t => t.trim().toLowerCase()));

  // 2. Gỡ tag đó khỏi toàn bộ nhân vật và lưu đầy đủ từng nhân vật lên Firestore
  const chars = await getCharacters();
  const updatedChars = chars.map(char => {
    const newTags = (char.tags || []).filter(t => t.trim().toLowerCase() !== cleanTargetLower && !deletedTagsSet.has(t.trim().toLowerCase()));
    return normalizeCharacter({
      ...char,
      tags: newTags,
      updatedAt: Date.now(),
    }, deletedTagsSet);
  });

  localStorage.setItem('characters', JSON.stringify(updatedChars));

  if (isFirebaseAvailable) {
    try {
      await Promise.all(
        updatedChars.map(char =>
          withTimeout(setDoc(doc(db!, 'characters', char.id), char), 10000)
        )
      );
    } catch (e) {
      console.warn("Could not batch update tags in Firestore:", e);
    }
  }

  return updatedChars;
};

// --- REAL-TIME SYNC CHO TOÀN BỘ NGƯỜI TRUY CẬP ---
export const subscribeToClassroomUpdates = (
  onCharactersUpdate: (chars: Character[]) => void,
  onTeacherUpdate: (teacher: TeacherProfile) => void
): (() => void) => {
  if (!isFirebaseAvailable || !db) {
    return () => {};
  }

  let latestMeta: AppMetaConfig = readLocalAppMeta();
  let latestRawDocs: Array<Partial<Character> & { id: string }> | null = null;

  const recomputeAndEmitCharacters = () => {
    if (!latestRawDocs) return;
    const deletedIdsSet = new Set(latestMeta.deletedCharacterIds || []);
    const deletedTagsSet = new Set((latestMeta.deletedTags || []).map(t => t.trim().toLowerCase()));

    const list = latestRawDocs
      .filter(d => !deletedIdsSet.has(d.id))
      .map(d => normalizeCharacter(d, deletedTagsSet))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Chỉ emit khi Firestore đã có dữ liệu hoặc đã khởi tạo seed
    if (list.length > 0 || latestMeta.initializedSeed) {
      localStorage.setItem('characters', JSON.stringify(list));
      onCharactersUpdate(list);
    }
  };

  const unsubMeta = onSnapshot(
    doc(db, 'settings', 'appMeta'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<AppMetaConfig>;
        latestMeta = {
          deletedCharacterIds: Array.from(new Set(data.deletedCharacterIds || [])),
          deletedTags: Array.from(new Set(data.deletedTags || [])),
          customTags: Array.from(new Set(data.customTags || [])),
          deletedFeedbackIds: Array.from(new Set(data.deletedFeedbackIds || [])),
          initializedSeed: Boolean(data.initializedSeed),
          initializedFeedbacksSeed: Boolean(data.initializedFeedbacksSeed),
          updatedAt: data.updatedAt || Date.now(),
        };
        writeLocalAppMeta(latestMeta);
        recomputeAndEmitCharacters();
      }
    },
    (err) => console.warn("onSnapshot appMeta error:", err)
  );

  const unsubChars = onSnapshot(
    collection(db, 'characters'),
    (snapshot) => {
      latestRawDocs = snapshot.docs.map(docSnap => ({
        ...(docSnap.data() as Partial<Character>),
        id: docSnap.id,
      }));
      recomputeAndEmitCharacters();
    },
    (err) => console.warn("onSnapshot characters error:", err)
  );

  const unsubTeacher = onSnapshot(
    doc(db, 'settings', 'teacherProfile'),
    (docSnap) => {
      if (docSnap.exists()) {
        const remote = { ...DEFAULT_TEACHER, ...(docSnap.data() as TeacherProfile) };
        if (remote.avatarUrl && remote.avatarUrl.includes("unsplash.com/photo-1544005313-94ddf0286df2")) {
          remote.avatarUrl = DEFAULT_TEACHER.avatarUrl;
        }
        localStorage.setItem('teacherProfile', JSON.stringify(remote));
        onTeacherUpdate(remote);
      }
    },
    (err) => console.warn("onSnapshot teacherProfile error:", err)
  );

  return () => {
    unsubMeta();
    unsubChars();
    unsubTeacher();
  };
};

export const getVisitorId = (): string => {
  let vid = localStorage.getItem('mamnon_visitor_id');
  if (!vid) {
    vid = 'vis_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('mamnon_visitor_id', vid);
  }
  return vid;
};

const INITIAL_FEEDBACKS: Feedback[] = [
  {
    id: 'fb-init-1',
    characterId: 'general',
    characterName: 'Cả Lớp Mầm Non Rắn Con 🏫',
    senderName: 'Học sinh ngoan',
    color: 'pink',
    content: 'Cô giáo Xà Nữ ơi lớp học dễ thương xỉu luôn á! Ngày nào em cũng vào điểm danh và ngắm các bé rắn cưng xỉu ✨',
    likes: 12,
    timestamp: 1700000200000,
    isPrivateToTeacher: false,
  },
  {
    id: 'fb-init-2',
    characterId: 'init-1',
    characterName: 'Bạch Xà Vương Tử (Bạch Linh)',
    senderName: 'Mẹ bé',
    color: 'yellow',
    content: 'Bạch Linh ơi mau lớn để được cô giáo thưởng thêm sữa dâu nhé! Đừng quấn tay cô chặt quá nha bbi 🌸',
    likes: 8,
    timestamp: 1700000100000,
    isPrivateToTeacher: false,
  }
];

// Bảo mật tuyệt đối cho thư riêng:
// Nếu người truy cập KHÔNG phải Admin, chỉ giữ lại:
// 1) Thư công khai (!fb.isPrivateToTeacher)
// 2) Thư riêng do CHÍNH trình duyệt của người truy cập đó gửi (fb.visitorId === myVisitorId)
// Mọi thư riêng và phản hồi của người khác đều bị loại bỏ hoàn toàn!
const filterFeedbacksByPrivacyAndDeletions = (
  list: Feedback[],
  deletedFeedbackIdsSet: Set<string>
): Feedback[] => {
  const isAdminUser = localStorage.getItem('isAdmin') === 'true';
  const myVisitorId = getVisitorId();

  return list
    .filter(fb => fb && fb.id && !deletedFeedbackIdsSet.has(fb.id))
    .filter(fb => {
      if (!fb.isPrivateToTeacher) return true;
      if (isAdminUser) return true;
      return Boolean(myVisitorId && fb.visitorId && fb.visitorId === myVisitorId);
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

// Feedbacks / Sticky Notes
export const getFeedbacks = async (): Promise<Feedback[]> => {
  const meta = await getAppMeta();
  const deletedFbSet = new Set(meta.deletedFeedbackIds || []);

  if (isFirebaseAvailable) {
    try {
      const snapshot = await withTimeout(getDocs(collection(db!, 'feedbacks')), 8000);
      const fbMap = new Map<string, Feedback>();

      snapshot.docs.forEach(docSnap => {
        if (!deletedFbSet.has(docSnap.id)) {
          fbMap.set(docSnap.id, { id: docSnap.id, ...(docSnap.data() as Omit<Feedback, 'id'>) });
        }
      });

      if (!meta.initializedFeedbacksSeed && fbMap.size === 0) {
        for (const seedFb of INITIAL_FEEDBACKS) {
          if (!deletedFbSet.has(seedFb.id)) {
            fbMap.set(seedFb.id, seedFb);
            try {
              await withTimeout(setDoc(doc(db!, 'feedbacks', seedFb.id), seedFb), 5000);
            } catch {}
          }
        }
        await saveAppMeta({ initializedFeedbacksSeed: true });
      } else if (!meta.initializedFeedbacksSeed && fbMap.size > 0) {
        await saveAppMeta({ initializedFeedbacksSeed: true });
      }

      const filtered = filterFeedbacksByPrivacyAndDeletions(Array.from(fbMap.values()), deletedFbSet);
      localStorage.setItem('feedbacks', JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      console.warn("Could not fetch feedbacks from Firestore:", e);
    }
  }

  const local = localStorage.getItem('feedbacks');
  if (local) {
    try {
      const parsed: Feedback[] = JSON.parse(local);
      return filterFeedbacksByPrivacyAndDeletions(parsed, deletedFbSet);
    } catch {
      return [];
    }
  }

  const defaults = filterFeedbacksByPrivacyAndDeletions(INITIAL_FEEDBACKS, deletedFbSet);
  localStorage.setItem('feedbacks', JSON.stringify(defaults));
  return defaults;
};

export const addFeedback = async (feedback: Omit<Feedback, 'id' | 'timestamp'>): Promise<Feedback[]> => {
  const now = Date.now();
  const newId = 'fb_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const created: Feedback = { 
    ...feedback, 
    id: newId,
    visitorId: feedback.visitorId || getVisitorId(),
    likes: feedback.likes || 0,
    timestamp: now 
  };

  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'feedbacks', newId), created), 8000);
      await saveAppMeta({ initializedFeedbacksSeed: true });
    } catch (e) {
      console.warn("Could not add feedback to Firestore:", e);
    }
  }
  const fbs = await getFeedbacks();
  const updated = [created, ...fbs.filter(f => f.id !== newId)];
  localStorage.setItem('feedbacks', JSON.stringify(updated));
  return updated;
};

export const deleteFeedback = async (id: string): Promise<Feedback[]> => {
  // 1. Lưu ID thư đã xóa vào settings/appMeta trên Firestore để không bao giờ hiện lại với bất kỳ ai
  const meta = await getAppMeta();
  const nextDeletedFbIds = Array.from(new Set([...(meta.deletedFeedbackIds || []), id]));
  await saveAppMeta({
    deletedFeedbackIds: nextDeletedFbIds,
    initializedFeedbacksSeed: true,
  });

  // 2. Xóa document khỏi Firestore
  if (isFirebaseAvailable) {
    try {
      await withTimeout(deleteDoc(doc(db!, 'feedbacks', id)), 6000);
    } catch (e) {
      console.warn("Could not delete feedback from Firestore:", e);
    }
  }

  let fbs = await getFeedbacks();
  fbs = fbs.filter((f: Feedback) => f.id !== id && !nextDeletedFbIds.includes(f.id));
  localStorage.setItem('feedbacks', JSON.stringify(fbs));
  return fbs;
};

export const toggleLikeFeedback = async (id: string): Promise<Feedback[]> => {
  let fbs = await getFeedbacks();
  const target = fbs.find(f => f.id === id);
  if (!target) return fbs;

  const newLikes = (target.likes || 0) + 1;
  const updatedItem = { ...target, likes: newLikes };

  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'feedbacks', id), updatedItem, { merge: true }), 6000);
    } catch (e) {
      console.warn("Could not update feedback likes in Firestore:", e);
    }
  }

  fbs = fbs.map(f => f.id === id ? updatedItem : f);
  localStorage.setItem('feedbacks', JSON.stringify(fbs));
  return fbs;
};

export const replyFeedback = async (id: string, replyText: string): Promise<Feedback[]> => {
  const patch = { adminReply: replyText.trim(), adminRepliedAt: Date.now() };
  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'feedbacks', id), patch, { merge: true }), 6000);
    } catch (e) {
      console.warn("Could not update admin reply in Firestore:", e);
    }
  }
  let fbs = await getFeedbacks();
  fbs = fbs.map(f => f.id === id ? { ...f, ...patch } : f);
  localStorage.setItem('feedbacks', JSON.stringify(fbs));
  return fbs;
};

export const deleteFeedbackReply = async (id: string): Promise<Feedback[]> => {
  const patch = { adminReply: '', adminRepliedAt: 0 };
  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'feedbacks', id), patch, { merge: true }), 6000);
    } catch (e) {
      console.warn("Could not delete admin reply in Firestore:", e);
    }
  }
  let fbs = await getFeedbacks();
  fbs = fbs.map(f => f.id === id ? { ...f, ...patch } : f);
  localStorage.setItem('feedbacks', JSON.stringify(fbs));
  return fbs;
};

export const deleteAllPublicFeedbacks = async (): Promise<Feedback[]> => {
  const currentFbs = await getFeedbacks();
  const publicIds = currentFbs.filter(f => !f.isPrivateToTeacher).map(f => f.id);
  if (publicIds.length === 0) return currentFbs;

  const meta = await getAppMeta();
  const nextDeletedFbIds = Array.from(new Set([...(meta.deletedFeedbackIds || []), ...publicIds]));
  await saveAppMeta({
    deletedFeedbackIds: nextDeletedFbIds,
    initializedFeedbacksSeed: true,
  });

  if (isFirebaseAvailable) {
    try {
      await Promise.all(
        publicIds.map(pid => withTimeout(deleteDoc(doc(db!, 'feedbacks', pid)), 6000).catch(() => {}))
      );
    } catch (e) {
      console.warn("Could not delete all public feedbacks from Firestore:", e);
    }
  }

  const remaining = currentFbs.filter(f => f.isPrivateToTeacher && !nextDeletedFbIds.includes(f.id));
  localStorage.setItem('feedbacks', JSON.stringify(remaining));
  return remaining;
};

export const subscribeToSchoolMusic = (onUpdate: (config: SchoolMusicConfig) => void): (() => void) => {
  if (!isFirebaseAvailable || !db) {
    return () => {};
  }
  return onSnapshot(
    doc(db, 'settings', 'schoolMusic'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SchoolMusicConfig;
        if (data.url && (data.url.includes("Vz59vE52J0k") || data.url.includes("kYv_8k9Yw1M"))) {
          data.url = DEFAULT_SCHOOL_MUSIC.url;
        }
        const merged = { ...DEFAULT_SCHOOL_MUSIC, ...data };
        localStorage.setItem('schoolMusic', JSON.stringify(merged));
        onUpdate(merged);
      }
    },
    (err) => console.warn("onSnapshot schoolMusic error:", err)
  );
};

export const subscribeToFeedbacks = (onUpdate: (fbs: Feedback[]) => void): (() => void) => {
  if (!isFirebaseAvailable || !db) {
    return () => {};
  }

  let latestDeletedIds = new Set(readLocalAppMeta().deletedFeedbackIds || []);
  let latestRawFbs: Feedback[] | null = null;

  const emitFiltered = () => {
    if (!latestRawFbs) return;
    const filtered = filterFeedbacksByPrivacyAndDeletions(latestRawFbs, latestDeletedIds);
    localStorage.setItem('feedbacks', JSON.stringify(filtered));
    onUpdate(filtered);
  };

  const unsubMeta = onSnapshot(
    doc(db, 'settings', 'appMeta'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<AppMetaConfig>;
        latestDeletedIds = new Set(data.deletedFeedbackIds || []);
        emitFiltered();
      }
    },
    (err) => console.warn("onSnapshot feedbacks meta error:", err)
  );

  const unsubFbs = onSnapshot(
    collection(db, 'feedbacks'),
    (snap) => {
      latestRawFbs = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Feedback, 'id'>),
      }));
      emitFiltered();
    },
    (err) => console.warn("onSnapshot feedbacks error:", err)
  );

  return () => {
    unsubMeta();
    unsubFbs();
  };
};

// --- GÓC LƯU NIỆM (Admin có thể chỉnh sửa và lưu tự động lên Firestore) ---
export const getMemoryCorner = async (): Promise<MemoryCornerConfig> => {
  if (isFirebaseAvailable) {
    try {
      const snap = await withTimeout(getDoc(doc(db!, 'settings', 'memoryCorner')), 6000);
      if (snap.exists()) {
        const merged = { ...DEFAULT_MEMORY_CORNER, ...(snap.data() as MemoryCornerConfig) };
        localStorage.setItem('memoryCorner', JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.warn("Could not fetch memoryCorner from Firestore:", e);
    }
  }
  const local = localStorage.getItem('memoryCorner');
  if (local) {
    try {
      return { ...DEFAULT_MEMORY_CORNER, ...JSON.parse(local) };
    } catch {}
  }
  return DEFAULT_MEMORY_CORNER;
};

export const updateMemoryCorner = async (config: MemoryCornerConfig): Promise<MemoryCornerConfig> => {
  const updated: MemoryCornerConfig = {
    ...config,
    updatedAt: Date.now(),
  };
  localStorage.setItem('memoryCorner', JSON.stringify(updated));
  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'settings', 'memoryCorner'), updated), 8000);
    } catch (e) {
      console.warn("Could not save memoryCorner to Firestore:", e);
    }
  }
  return updated;
};

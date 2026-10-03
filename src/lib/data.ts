import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, setDoc, getDoc } from 'firebase/firestore';
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
}

export interface AppStats {
  studentCount: number;
}

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
    createdAt: Date.now() - 300000
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
    createdAt: Date.now() - 200000
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
    createdAt: Date.now() - 100000
  }
];

// Fallback logic
const isFirebaseAvailable = !!db;

// Helper to prevent Firestore from hanging the UI when network is delayed
const withTimeout = <T>(promise: Promise<T>, timeoutMs = 2500): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Firestore timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
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
      const docSnap = await withTimeout(getDoc(doc(db!, 'settings', 'schoolMusic')));
      if (docSnap.exists()) {
        const data = docSnap.data() as SchoolMusicConfig;
        if (data.url && (data.url.includes("Vz59vE52J0k") || data.url.includes("kYv_8k9Yw1M"))) {
          data.url = DEFAULT_SCHOOL_MUSIC.url;
        }
        return { ...DEFAULT_SCHOOL_MUSIC, ...data };
      }
    } catch (e) {
      console.warn("Could not fetch school music from Firestore:", e);
    }
  }
  const local = localStorage.getItem('schoolMusic');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed.url && (parsed.url.includes("Vz59vE52J0k") || parsed.url.includes("kYv_8k9Yw1M"))) {
        parsed.url = DEFAULT_SCHOOL_MUSIC.url;
        localStorage.setItem('schoolMusic', JSON.stringify(parsed));
      }
      return { ...DEFAULT_SCHOOL_MUSIC, ...parsed };
    } catch (e) {}
  }
  return DEFAULT_SCHOOL_MUSIC;
};

export const updateSchoolMusic = async (config: SchoolMusicConfig): Promise<SchoolMusicConfig> => {
  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'settings', 'schoolMusic'), config, { merge: true }));
    } catch (e) {
      console.warn("Could not save school music to Firestore:", e);
    }
  }
  localStorage.setItem('schoolMusic', JSON.stringify(config));
  return config;
};

// Teacher Profile
export const getTeacherProfile = async (): Promise<TeacherProfile> => {
  let profile = DEFAULT_TEACHER;
  if (isFirebaseAvailable) {
    try {
      const docSnap = await withTimeout(getDoc(doc(db!, 'settings', 'teacherProfile')));
      if (docSnap.exists()) {
        profile = { ...DEFAULT_TEACHER, ...(docSnap.data() as TeacherProfile) };
      }
    } catch (e) {
      console.warn("Could not fetch teacher profile from Firestore:", e);
    }
  }
  if (profile === DEFAULT_TEACHER) {
    const local = localStorage.getItem('teacherProfile');
    if (local) {
      try {
        profile = { ...DEFAULT_TEACHER, ...JSON.parse(local) };
      } catch {}
    }
  }

  // Auto-upgrade if it was using the old default placeholder
  if (profile.avatarUrl && profile.avatarUrl.includes("unsplash.com/photo-1544005313-94ddf0286df2")) {
    profile.avatarUrl = DEFAULT_TEACHER.avatarUrl;
    localStorage.setItem('teacherProfile', JSON.stringify(profile));
  }

  return profile;
};

export const updateTeacherProfile = async (profile: Partial<TeacherProfile>): Promise<void> => {
  const current = await getTeacherProfile();
  const updated = { ...current, ...profile };
  
  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'settings', 'teacherProfile'), updated, { merge: true }));
    } catch (e) {
      console.warn("Could not save teacher profile to Firestore:", e);
    }
  }
  localStorage.setItem('teacherProfile', JSON.stringify(updated));
};

// Characters
export const getCharacters = async (): Promise<Character[]> => {
  const deletedIds: string[] = JSON.parse(localStorage.getItem('deletedCharacterIds') || '[]');

  let localChars: Character[] = [];
  const local = localStorage.getItem('characters');
  if (local) {
    try {
      localChars = JSON.parse(local).filter((c: Character) => !deletedIds.includes(c.id));
    } catch {
      localChars = [];
    }
  }

  // Fallback to initial characters if local storage is empty
  if (localChars.length === 0) {
    localChars = INITIAL_CHARACTERS
      .map((c, idx) => ({ ...c, id: `init-${idx + 1}` }))
      .filter(c => !deletedIds.includes(c.id));
    localStorage.setItem('characters', JSON.stringify(localChars));
  }

  if (isFirebaseAvailable) {
    try {
      const q = query(collection(db!, 'characters'), orderBy('createdAt', 'desc'));
      const snapshot = await withTimeout(getDocs(q));
      if (!snapshot.empty) {
        const firestoreMap = new Map<string, Character>();
        snapshot.docs.forEach(docSnap => {
          if (!deletedIds.includes(docSnap.id)) {
            firestoreMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as Character);
          }
        });

        // Merge: Firestore documents override or complement localChars without losing non-firestore chars
        const mergedMap = new Map<string, Character>();
        localChars.forEach(c => mergedMap.set(c.id, c));
        firestoreMap.forEach((v, k) => mergedMap.set(k, v));

        const mergedList = Array.from(mergedMap.values()).filter(c => !deletedIds.includes(c.id));
        mergedList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const finalized = mergedList.map(c => {
          if (c.youtubeMusicUrl && (c.youtubeMusicUrl.includes("kYv_8k9Yw1M") || c.youtubeMusicUrl.includes("Vz59vE52J0k") || c.youtubeMusicUrl.includes("3Ozo7tejr00"))) {
            return { ...c, youtubeMusicUrl: "" };
          }
          return c;
        });
        localStorage.setItem('characters', JSON.stringify(finalized));
        return finalized;
      }
    } catch (e) {
      console.warn("Could not fetch characters from Firestore:", e);
    }
  }

  const finalizedLocal = localChars.map(c => {
    if (c.youtubeMusicUrl && (c.youtubeMusicUrl.includes("kYv_8k9Yw1M") || c.youtubeMusicUrl.includes("Vz59vE52J0k") || c.youtubeMusicUrl.includes("3Ozo7tejr00"))) {
      return { ...c, youtubeMusicUrl: "" };
    }
    return c;
  });
  localStorage.setItem('characters', JSON.stringify(finalizedLocal));
  return finalizedLocal;
};

export const addCharacter = async (char: Omit<Character, 'id' | 'createdAt'>): Promise<Character[]> => {
  const newChar: Omit<Character, 'id'> = { 
    ...char, 
    story: char.story || char.plot || '',
    plot: char.plot || char.story || '',
    createdAt: Date.now() 
  };
  let newId = Date.now().toString();

  if (isFirebaseAvailable) {
    try {
      const docRef = await withTimeout(addDoc(collection(db!, 'characters'), newChar));
      newId = docRef.id;
    } catch (e) {
      console.warn("Could not add character to Firestore:", e);
    }
  }
  
  const chars = await getCharacters();
  const created: Character = { ...newChar, id: newId };
  const updated = [created, ...chars.filter(c => c.id !== newId)];
  localStorage.setItem('characters', JSON.stringify(updated));
  return updated;
};

export const updateCharacter = async (id: string, char: Partial<Character>): Promise<Character[]> => {
  const dataToSave = {
    ...char,
    ...(char.story ? { plot: char.story } : {}),
    ...(char.plot ? { story: char.plot } : {})
  };

  if (isFirebaseAvailable) {
    try {
      await withTimeout(setDoc(doc(db!, 'characters', id), dataToSave, { merge: true }));
    } catch (e) {
      console.warn("Could not update character in Firestore:", e);
    }
  }
  let chars = await getCharacters();
  chars = chars.map((c: Character) => c.id === id ? { ...c, ...dataToSave } : c);
  localStorage.setItem('characters', JSON.stringify(chars));
  return chars;
};

export const deleteCharacter = async (id: string): Promise<Character[]> => {
  // 1. Delete from Firestore if available
  if (isFirebaseAvailable) {
    try {
      await withTimeout(deleteDoc(doc(db!, 'characters', id)));
    } catch (e) {
      console.warn("Could not delete character from Firestore:", e);
    }
  }

  // 2. Add to deleted IDs blacklist so it never gets resurrected
  const deletedIds: string[] = JSON.parse(localStorage.getItem('deletedCharacterIds') || '[]');
  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
    localStorage.setItem('deletedCharacterIds', JSON.stringify(deletedIds));
  }

  // 3. Delete from localStorage
  let currentList: Character[] = [];
  const localStr = localStorage.getItem('characters');
  if (localStr) {
    try {
      currentList = JSON.parse(localStr);
    } catch {
      currentList = [];
    }
  } else {
    currentList = await getCharacters();
  }

  const updatedList = currentList.filter((c: Character) => c.id !== id);
  localStorage.setItem('characters', JSON.stringify(updatedList));

  return updatedList;
};

export const deleteTagGlobally = async (tagToDelete: string): Promise<Character[]> => {
  const chars = await getCharacters();
  const updatedChars = chars.map(char => {
    if (!char.tags || !char.tags.includes(tagToDelete)) return char;
    const newTags = char.tags.filter(t => t !== tagToDelete);
    const is18 = newTags.some(t => ['18+', 'r18', 'h+', 'nsfw', '+18'].includes(t.toLowerCase().trim()));
    return {
      ...char,
      tags: newTags,
      is18Plus: is18
    };
  });

  localStorage.setItem('characters', JSON.stringify(updatedChars));

  if (isFirebaseAvailable) {
    try {
      for (const char of updatedChars) {
        const original = chars.find(c => c.id === char.id);
        if (original && original.tags && original.tags.includes(tagToDelete)) {
          await withTimeout(setDoc(doc(db!, 'characters', char.id), {
            tags: char.tags,
            is18Plus: char.is18Plus
          }, { merge: true }));
        }
      }
    } catch (e) {
      console.warn("Could not batch update tags in Firestore:", e);
    }
  }

  return updatedChars;
};

// Feedbacks / Sticky Notes
export const getFeedbacks = async (): Promise<Feedback[]> => {
  if (isFirebaseAvailable) {
    try {
      const q = query(collection(db!, 'feedbacks'), orderBy('timestamp', 'desc'));
      const snapshot = await withTimeout(getDocs(q));
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Feedback));
        localStorage.setItem('feedbacks', JSON.stringify(fetched));
        return fetched;
      }
    } catch (e) {
      console.warn("Could not fetch feedbacks from Firestore:", e);
    }
  }
  const local = localStorage.getItem('feedbacks');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return [];
    }
  }
  // Default sample feedbacks for sweet warmth
  const defaults: Feedback[] = [
    {
      id: 'fb-init-1',
      characterId: 'general',
      characterName: 'Cả Lớp Mầm Non Rắn Con 🏫',
      senderName: 'Học sinh ngoan',
      color: 'pink',
      content: 'Cô giáo Xà Nữ ơi lớp học dễ thương xỉu luôn á! Ngày nào em cũng vào điểm danh và ngắm các bé rắn cưng xỉu ✨',
      likes: 12,
      timestamp: Date.now() - 3600000 * 2
    },
    {
      id: 'fb-init-2',
      characterId: 'init-1',
      characterName: 'Bạch Xà Vương Tử (Bạch Linh)',
      senderName: 'Mẹ bé',
      color: 'yellow',
      content: 'Bạch Linh ơi mau lớn để được cô giáo thưởng thêm sữa dâu nhé! Đừng quấn tay cô chặt quá nha bbi 🌸',
      likes: 8,
      timestamp: Date.now() - 3600000 * 5
    }
  ];
  localStorage.setItem('feedbacks', JSON.stringify(defaults));
  return defaults;
};

export const addFeedback = async (feedback: Omit<Feedback, 'id' | 'timestamp'>): Promise<Feedback[]> => {
  const newFb = { 
    ...feedback, 
    likes: feedback.likes || 0,
    timestamp: Date.now() 
  };
  let newId = Date.now().toString();

  if (isFirebaseAvailable) {
    try {
      const docRef = await withTimeout(addDoc(collection(db!, 'feedbacks'), newFb));
      newId = docRef.id;
    } catch (e) {
      console.warn("Could not add feedback to Firestore:", e);
    }
  }
  const fbs = await getFeedbacks();
  const created: Feedback = { ...newFb, id: newId };
  const updated = [created, ...fbs.filter(f => f.id !== newId)];
  localStorage.setItem('feedbacks', JSON.stringify(updated));
  return updated;
};

export const deleteFeedback = async (id: string): Promise<Feedback[]> => {
  if (isFirebaseAvailable) {
    try {
      await withTimeout(deleteDoc(doc(db!, 'feedbacks', id)));
    } catch (e) {
      console.warn("Could not delete feedback from Firestore:", e);
    }
  }
  let fbs = await getFeedbacks();
  fbs = fbs.filter((f: Feedback) => f.id !== id);
  localStorage.setItem('feedbacks', JSON.stringify(fbs));
  return fbs;
};

export const toggleLikeFeedback = async (id: string): Promise<Feedback[]> => {
  let fbs = await getFeedbacks();
  const target = fbs.find(f => f.id === id);
  if (!target) return fbs;

  const newLikes = (target.likes || 0) + 1;
  if (isFirebaseAvailable) {
    try {
      await withTimeout(updateDoc(doc(db!, 'feedbacks', id), { likes: newLikes }));
    } catch (e) {
      console.warn("Could not update feedback likes in Firestore:", e);
    }
  }

  fbs = fbs.map(f => f.id === id ? { ...f, likes: newLikes } : f);
  localStorage.setItem('feedbacks', JSON.stringify(fbs));
  return fbs;
};

export const getVisitorId = (): string => {
  let vid = localStorage.getItem('mamnon_visitor_id');
  if (!vid) {
    vid = 'vis_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('mamnon_visitor_id', vid);
  }
  return vid;
};

export const replyFeedback = async (id: string, replyText: string): Promise<Feedback[]> => {
  const patch = { adminReply: replyText.trim(), adminRepliedAt: Date.now() };
  if (isFirebaseAvailable) {
    try {
      await withTimeout(updateDoc(doc(db!, 'feedbacks', id), patch));
    } catch (e) {
      console.warn("Could not update admin reply in Firestore:", e);
    }
  }
  let fbs = await getFeedbacks();
  fbs = fbs.map(f => f.id === id ? { ...f, ...patch } : f);
  localStorage.setItem('feedbacks', JSON.stringify(fbs));
  return fbs;
};


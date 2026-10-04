import React, { useState, useEffect } from 'react';
import { Background } from './components/Background';
import { Header, MainTabType } from './components/Header';
import { Hero } from './components/Hero';
import { CharacterList } from './components/CharacterList';
import { SchoolGate } from './components/SchoolGate';
import { AdminModal } from './components/AdminModal';
import { TeacherEditModal } from './components/TeacherEditModal';
import { RandomHusbandSection } from './components/RandomHusbandSection';
import { SecretMailboxSection } from './components/SecretMailboxSection';
import { MusicProvider } from './components/MusicPlayer';
import { MemoryCornerModal } from './components/Modals';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { AgeVerificationModal } from './components/AgeVerificationModal';
import { CharacterFormModal } from './components/CharacterFormModal';
import { 
  getCharacters, 
  getTeacherProfile, 
  DEFAULT_TEACHER, 
  Character, 
  TeacherProfile, 
  AppStats,
  deleteCharacter,
  deleteTagGlobally,
  subscribeToClassroomUpdates,
  syncAdminLocalToCloudIfNeeded
} from './lib/data';
import { Mail, Dices } from 'lucide-react';
import { soundManager } from './lib/audio';

export default function App() {
  // Gate / Inside state: luôn mở ở cổng trường để chuông tự kêu khi vừa vào web
  const [inClassroom, setInClassroom] = useState<boolean>(false);

  // Active Main Navigation Tab (Mục riêng biệt)
  const [activeTab, setActiveTab] = useState<MainTabType>('classroom');
  const [mailboxPreselectedCharId, setMailboxPreselectedCharId] = useState<string | null>(null);

  // Music auto play trigger
  const [musicTrigger, setMusicTrigger] = useState(false);

  // Admin & Modals
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showTeacherEditModal, setShowTeacherEditModal] = useState(false);
  const [showAddCharModal, setShowAddCharModal] = useState(false);
  const [editingGlobalChar, setEditingGlobalChar] = useState<Character | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState(false);

  // 18+ Age Verification
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('ageVerified18') === 'true';
  });

  // Dedicated Character Detail viewer
  const [activeDetailChar, setActiveDetailChar] = useState<Character | null>(null);
  const [pending18Char, setPending18Char] = useState<{ char: Character; action: 'detail' | 'googleAi' } | null>(null);

  // Data
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(DEFAULT_TEACHER);
  const [characters, setCharacters] = useState<Character[]>([]);

  // Sĩ số luôn luôn tự động cập nhật ngay lập tức theo số lượng characters
  const stats: AppStats = { studentCount: characters.length };

  const loadData = async (providedChars?: Character[]) => {
    try {
      if (providedChars) {
        setCharacters(providedChars);
      } else {
        const chars = await getCharacters();
        setCharacters(chars);
      }

      const teacher = await getTeacherProfile();
      setTeacherProfile(teacher);
    } catch (error) {
      console.error("Error loading app data:", error);
    }
  };

  useEffect(() => {
    const adminState = localStorage.getItem('isAdmin');
    if (adminState === 'true') {
      setIsAdmin(true);
    }
    loadData();

    // Lắng nghe cập nhật thời gian thực (Real-time) từ Firestore cho TẤT CẢ người truy cập
    const unsubscribe = subscribeToClassroomUpdates(
      (liveChars) => {
        setCharacters(liveChars);
      },
      (liveTeacher) => {
        setTeacherProfile(liveTeacher);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Tự động đồng bộ activeDetailChar nếu nhân vật đang mở vừa được sửa hoặc xóa
  useEffect(() => {
    if (activeDetailChar) {
      const updated = characters.find(c => c.id === activeDetailChar.id);
      if (updated) {
        setActiveDetailChar(updated);
      } else if (characters.length > 0) {
        setActiveDetailChar(null);
      }
    }
  }, [characters, activeDetailChar]);

  const handleEnterSchool = () => {
    setInClassroom(true);
    setMusicTrigger(true);
    sessionStorage.setItem('enteredSchool', 'true');
  };

  const handleReturnToGate = () => {
    soundManager.playPop();
    setInClassroom(false);
    setMusicTrigger(false);
    sessionStorage.removeItem('enteredSchool');
  };

  const handleSelectTab = (tab: MainTabType) => {
    soundManager.playPop();
    if (tab === 'memory') {
      setShowMemoryModal(true);
      return;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogin = async (success: boolean) => {
    if (success) {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      setShowAdminModal(false);
      await syncAdminLocalToCloudIfNeeded(true);
      await loadData();
    }
  };

  const handleAdminLogout = () => {
    soundManager.playPop();
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  const handleVerifyAge = () => {
    setIsAgeVerified(true);
    sessionStorage.setItem('ageVerified18', 'true');
  };

  // 18+ check
  const is18 = (char: Character) => {
    return !!char.is18Plus || (char.tags || []).some(t => ['18+', 'r18', 'h+', 'nsfw', '+18'].includes(t.toLowerCase().trim()));
  };

  const handleOpenCharDetail = (char: Character) => {
    if (is18(char) && !isAgeVerified) {
      setPending18Char({ char, action: 'detail' });
      return;
    }
    setActiveDetailChar(char);
  };

  const handleGoToMailbox = (char?: Character) => {
    if (char) {
      setMailboxPreselectedCharId(char.id);
    }
    setActiveTab('mailbox');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePending18Confirm = () => {
    handleVerifyAge();
    if (pending18Char) {
      if (pending18Char.action === 'detail') {
        setActiveDetailChar(pending18Char.char);
      } else if (pending18Char.action === 'googleAi') {
        const link = pending18Char.char.linkUrl || pending18Char.char.googleAiLink;
        if (link) window.open(link, '_blank');
      }
      setPending18Char(null);
    }
  };

  return (
    <MusicProvider 
      autoPlayTrigger={inClassroom && musicTrigger} 
      isAdmin={isAdmin}
      isPausedByModal={!!(activeDetailChar?.youtubeMusicUrl)}
    >
      <div className="min-h-screen relative font-['Mali'] text-[#4f4263] bg-[#EFE9FB] selection:bg-[#FFE8F7] selection:text-pink-900">

      {!inClassroom ? (
        /* --- OUTSIDE SCHOOL GATE (CUTE PASTEL PURPLE KINDERGARTEN ENTRANCE) --- */
        <SchoolGate 
          onEnterSchool={handleEnterSchool} 
          studentCount={stats.studentCount} 
        />
      ) : (
        /* --- INSIDE THE KINDERGARTEN CLASSROOM (SOFT PASTEL #EFE9FB THEME) --- */
        <div className="min-h-screen">
          <Background />

          {/* Header with Dedicated Tabs */}
          <Header 
            stats={stats} 
            isAdmin={isAdmin} 
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onAdminClick={() => setShowAdminModal(true)} 
            onGateClick={handleReturnToGate}
          />
          
          <main className="container mx-auto px-4 pt-32 md:pt-28 pb-28 max-w-5xl space-y-8 relative z-10 animate-fade-in">
            
            {/* TAB 1: 🎒 LỚP BÉ NGOAN (Hero + Character List) */}
            {activeTab === 'classroom' && (
              <>
                <Hero 
                  stats={stats} 
                  teacherProfile={teacherProfile}
                  isAdmin={isAdmin}
                  onEditTeacher={() => setShowTeacherEditModal(true)}
                />

                <CharacterList 
                  characters={characters} 
                  isAdmin={isAdmin} 
                  onDataChange={loadData}
                  onOpenRandomHusband={() => handleSelectTab('lottery')}
                  isAgeVerified={isAgeVerified}
                  onVerifyAge={handleVerifyAge}
                />
              </>
            )}

            {/* TAB 2: 🎲 BỐC THĂM BÉ CHỒNG (MỤC RIÊNG BIỆT) */}
            {activeTab === 'lottery' && (
              <RandomHusbandSection
                characters={characters}
                isAdmin={isAdmin}
                onOpenCharacterDetail={handleOpenCharDetail}
                onSendFeedbackToChar={(char) => handleGoToMailbox(char)}
                onGoToClassroom={() => handleSelectTab('classroom')}
              />
            )}

            {/* TAB 3: 💌 HỘP THƯ BÍ MẬT (MỤC RIÊNG BIỆT) */}
            {activeTab === 'mailbox' && (
              <SecretMailboxSection
                characters={characters}
                isAdmin={isAdmin}
                preselectedCharId={mailboxPreselectedCharId}
                onGoToClassroom={() => handleSelectTab('classroom')}
              />
            )}
          </main>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Admin Login & Control Panel Modal */}
      {showAdminModal && (
        <AdminModal 
          isAdmin={isAdmin}
          onClose={() => setShowAdminModal(false)} 
          onLogin={handleAdminLogin} 
          onLogout={handleAdminLogout}
          onOpenTeacherEdit={() => setShowTeacherEditModal(true)}
          onOpenAddCharacter={() => setShowAddCharModal(true)}
          onEditCharacter={(char) => setEditingGlobalChar(char)}
          onOpenViewFeedbacks={() => {
            setShowAdminModal(false);
            handleSelectTab('mailbox');
          }}
          characters={characters}
          onDeleteCharacter={async (id: string) => {
            const updated = await deleteCharacter(id);
            loadData(updated);
          }}
          onDeleteTag={async (tag: string) => {
            const updated = await deleteTagGlobally(tag);
            loadData(updated);
          }}
        />
      )}

      {/* Teacher Profile Customizer Modal */}
      {showTeacherEditModal && (
        <TeacherEditModal
          currentProfile={teacherProfile}
          onClose={() => setShowTeacherEditModal(false)}
          onSuccess={(newProf) => {
            setTeacherProfile(newProf);
            loadData();
          }}
        />
      )}

      {/* Add / Edit Character Modal */}
      {(showAddCharModal || editingGlobalChar) && (
        <CharacterFormModal
          characterToEdit={editingGlobalChar}
          onClose={() => {
            setShowAddCharModal(false);
            setEditingGlobalChar(null);
          }}
          onSuccess={(updated) => loadData(updated)}
        />
      )}

      {/* Memory Corner Modal */}
      {showMemoryModal && (
        <MemoryCornerModal
          onClose={() => setShowMemoryModal(false)}
          isAdmin={isAdmin}
        />
      )}

      {/* Character Detail Modal (Vertical photo, Tuổi, Ngày sinh, Thích, Ghét, Story, In-app Music) */}
      {activeDetailChar && (
        <CharacterDetailModal
          character={activeDetailChar}
          onClose={() => setActiveDetailChar(null)}
          onOpenFeedback={(char) => {
            setActiveDetailChar(null);
            handleGoToMailbox(char);
          }}
          isAdmin={isAdmin}
          onEditCharacter={(char) => {
            setActiveDetailChar(null);
            setEditingGlobalChar(char);
          }}
        />
      )}

      {/* Age Verification Modal for pending 18+ action */}
      {pending18Char && (
        <AgeVerificationModal
          characterName={pending18Char.char.name}
          onConfirm={handlePending18Confirm}
          onCancel={() => setPending18Char(null)}
        />
      )}

      </div>
    </MusicProvider>
  );
}

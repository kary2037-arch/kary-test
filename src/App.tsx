import { useState, useEffect, useCallback } from 'react';
import { Student, DrawSettings } from './types';
import { SAMPLE_STUDENTS } from './utils/rosterParser';
import RosterManager from './components/RosterManager';
import RandomPicker from './components/RandomPicker';
import GroupMaker from './components/GroupMaker';
import { 
  Dices, 
  Users, 
  ClipboardList, 
  GraduationCap, 
  Volume2, 
  VolumeX, 
  BookOpen
} from 'lucide-react';

const STORAGE_KEY_STUDENTS = 'classroom_helper_students_v1';
const STORAGE_KEY_DRAW_SETTINGS = 'classroom_helper_draw_settings_v1';

export default function App() {
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'picker' | 'group' | 'roster'>('picker');

  // Load students from localStorage or fallback to sample
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return SAMPLE_STUDENTS;
  });

  // Load draw settings
  const [drawSettings, setDrawSettings] = useState<DrawSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAW_SETTINGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      allowRepeat: false, // Default to no-repeat (teachers' most common classroom preference)
      animationSpeed: 'normal',
      soundEnabled: true,
      volume: 0.6,
      confettiEnabled: true,
    };
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DRAW_SETTINGS, JSON.stringify(drawSettings));
    } catch {
      // ignore
    }
  }, [drawSettings]);

  // Spacebar trigger handler for lottery
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' && activeTab === 'picker') {
        e.preventDefault();
        const drawBtn = document.getElementById('btn-trigger-draw') as HTMLButtonElement;
        if (drawBtn && !drawBtn.disabled) {
          drawBtn.click();
        }
      }
    },
    [activeTab]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-sm shadow-indigo-500/30 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                課堂抽籤與分組小幫手
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  教師版
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden md:block">
                名單匯入 · 隨機點名抽籤 · 自動視覺化分組
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              id="tab-picker"
              type="button"
              onClick={() => setActiveTab('picker')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Dices className="w-4 h-4 text-indigo-500" />
              <span>隨機抽籤 (功能1)</span>
            </button>

            <button
              id="tab-group"
              type="button"
              onClick={() => setActiveTab('group')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'group'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>自動分組 (功能2)</span>
            </button>

            <button
              id="tab-roster"
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-slate-500" />
              <span>名單管理</span>
              <span className="w-5 h-5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                {students.length}
              </span>
            </button>
          </nav>

          {/* Right Status / Sound Quick Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDrawSettings((prev) => ({
                  ...prev,
                  soundEnabled: !prev.soundEnabled,
                }))
              }
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                drawSettings.soundEnabled
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={drawSettings.soundEnabled ? '音效已開啟 (點擊靜音)' : '音效已關閉'}
            >
              {drawSettings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-600" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            drawSettings={drawSettings}
            onUpdateSettings={setDrawSettings}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'group' && (
          <GroupMaker
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={setStudents}
            onNavigateToDraw={() => setActiveTab('picker')}
            onNavigateToGroup={() => setActiveTab('group')}
          />
        )}
      </main>

      {/* Classroom Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>目前載入：{students.length} 位學生名單</span>
            {activeTab === 'picker' && (
              <span className="hidden sm:inline text-slate-400">
                · 💡 提示：在抽籤畫面可直接按空白鍵 (Space) 快速抽籤
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>支援 CSV 匯入、文字貼上與本機自動儲存</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

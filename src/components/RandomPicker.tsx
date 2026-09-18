import { useState, useEffect, useRef, useMemo } from 'react';
import { Student, DrawRecord, DrawSettings } from '../types';
import { playTickSound, playTensionClick, playCelebrationFanfare } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { 
  Dices, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  History, 
  Users, 
  CheckCircle2, 
  Repeat, 
  Ban,
  Flame,
  Undo2
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  drawSettings: DrawSettings;
  onUpdateSettings: (settings: DrawSettings) => void;
  onNavigateToRoster?: () => void;
}

export default function RandomPicker({
  students,
  drawSettings,
  onUpdateSettings,
  onNavigateToRoster,
}: RandomPickerProps) {
  // Pool management
  const [drawnRecords, setDrawnRecords] = useState<DrawRecord[]>([]);
  const [currentWinner, setCurrentWinner] = useState<Student | null>(null);
  const [rollingName, setRollingName] = useState<string>('？');
  const [rollingSeat, setRollingSeat] = useState<number | undefined>(undefined);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<number | null>(null);

  // Available students pool (for non-repeat mode)
  const drawnStudentIds = useMemo(() => {
    return new Set(drawnRecords.map((r) => r.studentId));
  }, [drawnRecords]);

  const remainingStudents = useMemo(() => {
    if (drawSettings.allowRepeat) return students;
    return students.filter((s) => !drawnStudentIds.has(s.id));
  }, [students, drawnStudentIds, drawSettings.allowRepeat]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  // Trigger Confetti
  const triggerConfetti = () => {
    if (!drawSettings.confettiEnabled) return;
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.7 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.7 },
        });
      }, 200);
    } catch {
      // Confetti fallback ignored
    }
  };

  // The Core Lottery Animation Logic
  const handleStartDraw = () => {
    if (isRolling) return;

    // Determine eligible candidates
    const eligiblePool = drawSettings.allowRepeat ? students : remainingStudents;

    if (eligiblePool.length === 0) {
      return;
    }

    setIsRolling(true);
    setCurrentWinner(null);

    // Pick final winner upfront
    const randomIndex = Math.floor(Math.random() * eligiblePool.length);
    const chosenWinner = eligiblePool[randomIndex];

    // Determine duration based on speed setting
    const durations = {
      fast: 1600,
      normal: 2800,
      suspense: 4200,
    };
    const totalDuration = durations[drawSettings.animationSpeed] || 2800;

    const startTime = Date.now();
    let currentInterval = 45; // Starts fast (45ms per name)

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Deceleration curve (cubic ease-out)
      // As progress approaches 1, interval increases smoothly
      currentInterval = 45 + Math.pow(progress, 2.5) * 380;

      // Random name from entire class for excitement
      const previewCandidate = students[Math.floor(Math.random() * students.length)];
      setRollingName(previewCandidate.name);
      setRollingSeat(previewCandidate.seatNumber);

      // Sound feedback
      if (drawSettings.soundEnabled) {
        if (progress > 0.75) {
          playTensionClick(drawSettings.volume);
        } else {
          // Pitch increases slightly towards middle
          const pitch = 0.9 + progress * 0.4;
          playTickSound(drawSettings.volume, pitch);
        }
      }

      if (elapsed < totalDuration) {
        animationTimerRef.current = window.setTimeout(step, currentInterval);
      } else {
        // Animation Completed! Reveal winner!
        setRollingName(chosenWinner.name);
        setRollingSeat(chosenWinner.seatNumber);
        setCurrentWinner(chosenWinner);
        setIsRolling(false);

        // Sound fanfare & confetti
        if (drawSettings.soundEnabled) {
          playCelebrationFanfare(drawSettings.volume);
        }
        triggerConfetti();

        // Record history
        const newRecord: DrawRecord = {
          id: `draw-${Date.now()}`,
          studentId: chosenWinner.id,
          studentName: chosenWinner.name,
          seatNumber: chosenWinner.seatNumber,
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          round: drawnRecords.length + 1,
        };
        setDrawnRecords((prev) => [newRecord, ...prev]);
      }
    };

    // Kickoff animation loop
    step();
  };

  // Reset history & pool
  const handleResetPool = () => {
    if (drawnRecords.length === 0) return;
    if (confirm('確定要重設抽籤紀錄嗎？所有學生將重回待抽池。')) {
      setDrawnRecords([]);
      setCurrentWinner(null);
      setRollingName('？');
      setRollingSeat(undefined);
    }
  };

  // Put a single student back to the pool
  const handlePutBackStudent = (recordId: string) => {
    setDrawnRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Empty state check
  if (students.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">名單庫尚未有學生</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          請先上傳 CSV 檔案或貼上學生名單，即可開始隨機點名抽籤！
        </p>
        {onNavigateToRoster && (
          <button
            onClick={onNavigateToRoster}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shadow-sm"
          >
            前往名單管理 →
          </button>
        )}
      </div>
    );
  }

  const isPoolExhausted = !drawSettings.allowRepeat && remainingStudents.length === 0;

  return (
    <div ref={containerRef} className={`space-y-6 ${isFullscreen ? 'bg-slate-900 p-8 min-h-screen flex flex-col justify-between' : ''}`}>
      {/* Settings & Status Bar */}
      <div className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
        isFullscreen ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        {/* Left: Mode toggle (Repeat vs Non-Repeat) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              id="btn-mode-non-repeat"
              type="button"
              onClick={() => onUpdateSettings({ ...drawSettings, allowRepeat: false })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                !drawSettings.allowRepeat
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              不重複抽取（推薦）
            </button>
            <button
              id="btn-mode-repeat"
              type="button"
              onClick={() => onUpdateSettings({ ...drawSettings, allowRepeat: true })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                drawSettings.allowRepeat
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              允許重複抽取
            </button>
          </div>

          {/* Counters badge */}
          <div className="flex items-center gap-2 text-xs">
            {!drawSettings.allowRepeat ? (
              <>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                  待抽：{remainingStudents.length} 人
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                  已抽：{drawnRecords.length} 人
                </span>
              </>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
                全班隨機：共 {students.length} 人
              </span>
            )}
          </div>
        </div>

        {/* Right: Sound, Animation Speed & Fullscreen Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={() => onUpdateSettings({ ...drawSettings, soundEnabled: !drawSettings.soundEnabled })}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              drawSettings.soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title={drawSettings.soundEnabled ? '音效開啟 (點擊靜音)' : '音效已關閉 (點擊開啟)'}
          >
            {drawSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{drawSettings.soundEnabled ? '音效開' : '靜音'}</span>
          </button>

          {/* Speed Selector */}
          <select
            id="select-animation-speed"
            value={drawSettings.animationSpeed}
            onChange={(e) =>
              onUpdateSettings({
                ...drawSettings,
                animationSpeed: e.target.value as 'fast' | 'normal' | 'suspense',
              })
            }
            className={`text-xs px-2.5 py-2 rounded-lg border focus:outline-none cursor-pointer ${
              isFullscreen 
                ? 'bg-slate-700 border-slate-600 text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="fast">快速抽籤 (1.5秒)</option>
            <option value="normal">標準動畫 (2.8秒)</option>
            <option value="suspense">懸疑緊張 (4.2秒)</option>
          </select>

          {/* Fullscreen Button */}
          <button
            id="btn-toggle-fullscreen"
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs flex items-center gap-1 transition-all cursor-pointer"
            title={isFullscreen ? '退出全螢幕' : '全螢幕投影展示'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Lottery Stage */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all text-center ${
        isFullscreen 
          ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700 py-16' 
          : 'bg-gradient-to-b from-slate-50 to-white border-slate-200/90 py-12 shadow-sm'
      }`}>
        {/* Subtle Decorative Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto px-4 space-y-6">
          {/* Status Label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {isRolling 
              ? '命運之輪滾動中...' 
              : currentWinner 
                ? '🎉 恭喜被抽中的同學！' 
                : isPoolExhausted 
                  ? '已全數抽取完畢！' 
                  : '點擊下方按鈕開始抽籤'}
          </div>

          {/* Large Animated Stage Card */}
          <div className={`relative mx-auto rounded-3xl p-8 sm:p-10 border transition-all duration-300 ${
            isRolling
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-500/20 scale-[1.02]'
              : currentWinner
                ? 'bg-white border-indigo-200 shadow-2xl ring-4 ring-indigo-500/10'
                : 'bg-white/80 border-slate-200 shadow-sm'
          }`}>
            {/* Seat Number Tag */}
            <div className="mb-3">
              {(rollingSeat !== undefined || currentWinner?.seatNumber !== undefined) ? (
                <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                  isRolling
                    ? 'bg-indigo-700/80 text-indigo-100'
                    : currentWinner
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-500'
                }`}>
                  座號 {(currentWinner?.seatNumber ?? rollingSeat)} 號
                </span>
              ) : (
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold opacity-0">
                  座號
                </span>
              )}
            </div>

            {/* Student Name Typography */}
            <div className="min-h-[100px] flex items-center justify-center">
              <h1 
                id="display-winner-name"
                className={`text-5xl sm:text-7xl font-extrabold tracking-tight transition-all select-none ${
                  isRolling
                    ? 'text-white scale-105 animate-pulse'
                    : currentWinner
                      ? 'text-slate-900 scale-100'
                      : 'text-slate-300'
                }`}
              >
                {rollingName}
              </h1>
            </div>

            {/* Winner Subtitle/Meta */}
            {currentWinner && !isRolling && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>第 {drawnRecords.length} 位抽出的幸運星</span>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            {isPoolExhausted ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600">
                  全班 {students.length} 位同學皆已被抽出過一次！
                </p>
                <button
                  id="btn-restart-pool"
                  type="button"
                  onClick={handleResetPool}
                  className="px-6 py-3.5 text-base font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  重新開啟新一輪抽籤
                </button>
              </div>
            ) : (
              <button
                id="btn-trigger-draw"
                type="button"
                disabled={isRolling}
                onClick={handleStartDraw}
                className={`w-full sm:w-auto min-w-[220px] px-8 py-4 text-lg font-bold rounded-2xl text-white transition-all transform cursor-pointer inline-flex items-center justify-center gap-3 shadow-lg ${
                  isRolling
                    ? 'bg-indigo-400 cursor-not-allowed scale-98'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-102 active:scale-98 shadow-indigo-600/30'
                }`}
              >
                <Dices className={`w-6 h-6 ${isRolling ? 'animate-spin' : ''}`} />
                <span>{isRolling ? '正在抽籤中...' : currentWinner ? '再抽下一位 🎲' : '開始隨機抽籤 🎲'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Drawer & Remaining Pool List */}
      {!isFullscreen && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Drawn Records History */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">抽籤歷史紀錄</h3>
                  <p className="text-xs text-slate-400">紀錄本堂課所有被抽出的學生順序</p>
                </div>
              </div>

              {drawnRecords.length > 0 && (
                <button
                  id="btn-clear-history"
                  type="button"
                  onClick={handleResetPool}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-rose-50"
                  title="重設所有抽籤紀錄"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重設紀錄
                </button>
              )}
            </div>

            {drawnRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                尚未進行任何抽籤，點擊上方按鈕開始抽出第一位幸運同學！
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-1 space-y-2">
                {drawnRecords.map((record, index) => (
                  <div
                    key={record.id}
                    id={`draw-record-${record.id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {drawnRecords.length - index}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 text-sm mr-2">
                          {record.studentName}
                        </span>
                        {record.seatNumber && (
                          <span className="text-[11px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200/60">
                            {record.seatNumber} 號
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">{record.timestamp}</span>
                      {!drawSettings.allowRepeat && (
                        <button
                          onClick={() => handlePutBackStudent(record.id)}
                          type="button"
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                          title="放回待抽池"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Pool Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {drawSettings.allowRepeat ? '候選名單池' : '待抽取名單'}
                </h3>
                <p className="text-xs text-slate-400">
                  {drawSettings.allowRepeat ? '每次皆從全班抽取' : `尚有 ${remainingStudents.length} 人未被抽出`}
                </p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-1.5">
                {(drawSettings.allowRepeat ? students : remainingStudents).map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200/70 text-slate-700"
                  >
                    <span className="text-[10px] text-slate-400 font-mono">#{s.seatNumber || ''}</span>
                    <span>{s.name}</span>
                  </span>
                ))}
              </div>

              {!drawSettings.allowRepeat && remainingStudents.length === 0 && (
                <div className="py-6 text-center text-xs text-emerald-600 font-medium">
                  🎉 全員均已抽出完畢！
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

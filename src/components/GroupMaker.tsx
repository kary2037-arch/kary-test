import { useState } from 'react';
import { Student, GroupResult, GroupSettings, RemainderStrategy } from '../types';
import { playShuffleSound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Shuffle, 
  Download, 
  Copy, 
  Check, 
  Settings2, 
  ArrowRightLeft, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  Edit2
} from 'lucide-react';

interface GroupMakerProps {
  students: Student[];
  onNavigateToRoster?: () => void;
}

const THEME_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-600', ring: 'ring-blue-100' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-600', ring: 'ring-emerald-100' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-600', ring: 'ring-amber-100' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-600', ring: 'ring-purple-100' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-600', ring: 'ring-rose-100' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-600', ring: 'ring-cyan-100' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-600', ring: 'ring-indigo-100' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-600', ring: 'ring-teal-100' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-600', ring: 'ring-orange-100' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-600', ring: 'ring-violet-100' },
];

const ANIMAL_NAMES = ['獅子組', '老鷹組', '海豚組', '獵豹組', '白熊組', '猛虎組', '神駒組', '灰狼組', '企鵝組', '飛龍組'];
const COLOR_NAMES = ['紅隊', '藍隊', '綠隊', '黃隊', '紫隊', '澄隊', '青隊', '粉隊', '金隊', '銀隊'];
const HERO_NAMES = ['領航隊', '破風隊', '凌雲隊', '超越隊', '躍進隊', '卓越隊', '飛馳隊', '巔峰隊', '閃電隊', '星芒隊'];

export default function GroupMaker({ students, onNavigateToRoster }: GroupMakerProps) {
  const [settings, setSettings] = useState<GroupSettings>({
    mode: 'bySize',
    groupSize: 4,
    groupCount: 4,
    remainderStrategy: 'distribute',
    namingStyle: 'number',
  });

  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected student for quick swap/transfer between groups
  const [selectedStudentToMove, setSelectedStudentToMove] = useState<{
    groupId: string;
    student: Student;
  } | null>(null);

  // Calculation previews
  const totalCount = students.length;
  const calculatedGroupCount = settings.mode === 'bySize'
    ? Math.max(1, Math.floor(totalCount / Math.max(1, settings.groupSize)))
    : settings.groupCount;
  const remainderCount = settings.mode === 'bySize'
    ? totalCount % Math.max(1, settings.groupSize)
    : 0;

  // Generate Group Name
  const getGroupName = (index: number, style: GroupSettings['namingStyle']) => {
    if (style === 'animal') return ANIMAL_NAMES[index % ANIMAL_NAMES.length];
    if (style === 'color') return COLOR_NAMES[index % COLOR_NAMES.length];
    if (style === 'hero') return HERO_NAMES[index % HERO_NAMES.length];
    return `第 ${index + 1} 組`;
  };

  // Main Grouping Logic
  const handleGenerateGroups = () => {
    if (students.length === 0) return;

    setIsShuffling(true);
    setSelectedStudentToMove(null);
    playShuffleSound(0.6);

    setTimeout(() => {
      // Fisher-Yates Shuffle of students
      const shuffled = [...students];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      let newGroups: GroupResult[] = [];

      if (settings.mode === 'bySize') {
        const size = Math.max(1, settings.groupSize);
        const baseGroupCount = Math.floor(shuffled.length / size);
        const remainder = shuffled.length % size;

        if (baseGroupCount === 0) {
          // If total students < groupSize, all into 1 group
          newGroups = [
            {
              id: 'group-1',
              name: getGroupName(0, settings.namingStyle),
              themeColor: THEME_COLORS[0].badge,
              students: shuffled,
            },
          ];
        } else if (remainder === 0) {
          // Exact division
          for (let i = 0; i < baseGroupCount; i++) {
            newGroups.push({
              id: `group-${i + 1}`,
              name: getGroupName(i, settings.namingStyle),
              themeColor: THEME_COLORS[i % THEME_COLORS.length].badge,
              students: shuffled.slice(i * size, (i + 1) * size),
            });
          }
        } else if (settings.remainderStrategy === 'distribute') {
          // Distribute remainder students evenly across the groups
          for (let i = 0; i < baseGroupCount; i++) {
            newGroups.push({
              id: `group-${i + 1}`,
              name: getGroupName(i, settings.namingStyle),
              themeColor: THEME_COLORS[i % THEME_COLORS.length].badge,
              students: shuffled.slice(i * size, (i + 1) * size),
            });
          }
          const leftover = shuffled.slice(baseGroupCount * size);
          leftover.forEach((st, idx) => {
            newGroups[idx % baseGroupCount].students.push(st);
          });
        } else {
          // Separate leftover group
          for (let i = 0; i < baseGroupCount; i++) {
            newGroups.push({
              id: `group-${i + 1}`,
              name: getGroupName(i, settings.namingStyle),
              themeColor: THEME_COLORS[i % THEME_COLORS.length].badge,
              students: shuffled.slice(i * size, (i + 1) * size),
            });
          }
          newGroups.push({
            id: `group-${baseGroupCount + 1}`,
            name: `${getGroupName(baseGroupCount, settings.namingStyle)} (餘額組)`,
            themeColor: THEME_COLORS[baseGroupCount % THEME_COLORS.length].badge,
            students: shuffled.slice(baseGroupCount * size),
          });
        }
      } else {
        // By Group Count
        const count = Math.min(Math.max(1, settings.groupCount), shuffled.length);
        for (let i = 0; i < count; i++) {
          newGroups.push({
            id: `group-${i + 1}`,
            name: getGroupName(i, settings.namingStyle),
            themeColor: THEME_COLORS[i % THEME_COLORS.length].badge,
            students: [],
          });
        }
        shuffled.forEach((st, idx) => {
          newGroups[idx % count].students.push(st);
        });
      }

      setGroups(newGroups);
      setIsShuffling(false);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }, 450);
  };

  // Move student to another group
  const handleMoveStudent = (targetGroupId: string) => {
    if (!selectedStudentToMove) return;
    if (selectedStudentToMove.groupId === targetGroupId) {
      setSelectedStudentToMove(null);
      return;
    }

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === selectedStudentToMove.groupId) {
          return {
            ...g,
            students: g.students.filter((s) => s.id !== selectedStudentToMove.student.id),
          };
        }
        if (g.id === targetGroupId) {
          return {
            ...g,
            students: [...g.students, selectedStudentToMove.student],
          };
        }
        return g;
      })
    );

    setSelectedStudentToMove(null);
  };

  // Rename group
  const handleSaveGroupName = (groupId: string) => {
    if (!editingGroupName.trim()) {
      setEditingGroupId(null);
      return;
    }
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: editingGroupName.trim() } : g))
    );
    setEditingGroupId(null);
  };

  // Copy groups to clipboard
  const handleCopyGroups = () => {
    if (groups.length === 0) return;
    const lines: string[] = ['【課堂分組名單】\n'];
    groups.forEach((g) => {
      const studentNames = g.students
        .map((s) => `${s.name}${s.seatNumber ? `(#${s.seatNumber})` : ''}`)
        .join('、');
      lines.push(`${g.name}（${g.students.length}人）：${studentNames}`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (groups.length === 0) return;
    let csv = '\uFEFF組別,座號,姓名\n';
    groups.forEach((g) => {
      g.students.forEach((s) => {
        csv += `"${g.name}",${s.seatNumber || ''},"${s.name.replace(/"/g, '""')}"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `課堂分組名單_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (students.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">名單庫尚未有學生</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          請先上傳 CSV 檔案或貼上學生名單，即可進行自動分組！
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

  return (
    <div className={`space-y-6 ${isFullscreen ? 'bg-slate-900 p-8 min-h-screen text-white' : ''}`}>
      {/* Configuration & Trigger Bar */}
      <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
        isFullscreen ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">分組規則設定</h3>
              <p className="text-xs text-slate-400">目前全班名單共 {students.length} 位同學</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-group-fullscreen"
              onClick={() => setIsFullscreen(!isFullscreen)}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              title="投影白板模式"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? '退出全螢幕' : '投影白板展示'}</span>
            </button>
          </div>
        </div>

        {/* Grouping Settings Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Setting 1: Mode & Number Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              分組依據模式
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                id="btn-mode-by-size"
                onClick={() => setSettings({ ...settings, mode: 'bySize' })}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  settings.mode === 'bySize'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                設定每組幾人
              </button>
              <button
                type="button"
                id="btn-mode-by-count"
                onClick={() => setSettings({ ...settings, mode: 'byCount' })}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  settings.mode === 'byCount'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                設定分成幾組
              </button>
            </div>

            {/* Value Stepper */}
            {settings.mode === 'bySize' ? (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500">每組人數：</span>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        groupSize: Math.max(2, settings.groupSize - 1),
                      })
                    }
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="input-group-size"
                    min={2}
                    max={students.length || 30}
                    value={settings.groupSize}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        groupSize: Math.max(2, parseInt(e.target.value, 10) || 2),
                      })
                    }
                    className="w-14 text-center font-bold text-sm bg-white py-1 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        groupSize: Math.min(students.length, settings.groupSize + 1),
                      })
                    }
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400">人 / 組</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500">總共分成：</span>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        groupCount: Math.max(2, settings.groupCount - 1),
                      })
                    }
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="input-group-count"
                    min={2}
                    max={students.length || 10}
                    value={settings.groupCount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        groupCount: Math.max(2, parseInt(e.target.value, 10) || 2),
                      })
                    }
                    className="w-14 text-center font-bold text-sm bg-white py-1 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        groupCount: Math.min(students.length, settings.groupCount + 1),
                      })
                    }
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400">組</span>
              </div>
            )}
          </div>

          {/* Setting 2: Remainder Strategy (when mode is bySize) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              多出人數分配方式
            </label>
            <select
              id="select-remainder-strategy"
              value={settings.remainderStrategy}
              disabled={settings.mode === 'byCount'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  remainderStrategy: e.target.value as RemainderStrategy,
                })
              }
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              <option value="distribute">平均分散到各組（推薦：每組多 1 人）</option>
              <option value="separateGroup">自成一組（最後一組人數較少）</option>
            </select>

            <div className="text-[11px] text-slate-500 pt-1">
              {settings.mode === 'bySize' && (
                <span>
                  預估：分為 {calculatedGroupCount} 組
                  {remainderCount > 0
                    ? `，餘 ${remainderCount} 人（${
                        settings.remainderStrategy === 'distribute'
                          ? '將自動補入各組'
                          : '將自成第 ' + (calculatedGroupCount + 1) + ' 組'
                      }）`
                    : '（整除無餘數）'}
                </span>
              )}
            </div>
          </div>

          {/* Setting 3: Naming style */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              組別名稱風格
            </label>
            <select
              id="select-naming-style"
              value={settings.namingStyle}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  namingStyle: e.target.value as GroupSettings['namingStyle'],
                })
              }
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="number">數字序號（第 1 組、第 2 組...）</option>
              <option value="animal">動物圖騰（獅子組、老鷹組、海豚組...）</option>
              <option value="color">色彩戰隊（紅隊、藍隊、綠隊、黃隊...）</option>
              <option value="hero">活力隊名（領航隊、破風隊、凌雲隊...）</option>
            </select>

            <div className="text-[11px] text-slate-400 pt-1">
              分組完成後亦可直接點擊組名自訂修改
            </div>
          </div>
        </div>

        {/* Action Trigger Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            點擊開始依據名單隨機打亂並分配隊伍
          </div>

          <button
            id="btn-generate-groups"
            type="button"
            disabled={isShuffling}
            onClick={handleGenerateGroups}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer"
          >
            <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{isShuffling ? '正在隨機分配組別...' : groups.length > 0 ? '重新隨機分組' : '開始自動分組 🚀'}</span>
          </button>
        </div>
      </div>

      {/* Visualized Grouping Results */}
      {groups.length > 0 && (
        <div className="space-y-4">
          {/* Result Header & Export Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-800">
                分組視覺化成果（共 {groups.length} 組）
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {selectedStudentToMove && (
                <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>已選取「{selectedStudentToMove.student.name}」，請點選目標小組完成移動</span>
                  <button
                    onClick={() => setSelectedStudentToMove(null)}
                    className="ml-2 underline text-[11px] cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              )}

              <button
                id="btn-copy-group-result"
                type="button"
                onClick={handleCopyGroups}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已複製！' : '複製文字分組'}</span>
              </button>

              <button
                id="btn-download-group-csv"
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出 CSV</span>
              </button>
            </div>
          </div>

          {/* Group Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group, groupIndex) => {
              const theme = THEME_COLORS[groupIndex % THEME_COLORS.length];
              const isTargetGroupForMove =
                selectedStudentToMove && selectedStudentToMove.groupId !== group.id;

              return (
                <div
                  key={group.id}
                  id={`group-card-${group.id}`}
                  onClick={() => {
                    if (isTargetGroupForMove) {
                      handleMoveStudent(group.id);
                    }
                  }}
                  className={`relative rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                    isTargetGroupForMove
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400 cursor-pointer shadow-md'
                      : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Group Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onBlur={() => handleSaveGroupName(group.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveGroupName(group.id)}
                            autoFocus
                            className="text-xs font-bold px-2 py-1 border rounded w-full"
                          />
                          <button
                            onClick={() => handleSaveGroupName(group.id)}
                            className="text-xs px-2 py-1 bg-indigo-600 text-white rounded cursor-pointer"
                          >
                            存
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full ${theme.badge} shrink-0`}
                          />
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            {group.name}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGroupId(group.id);
                                setEditingGroupName(group.name);
                              }}
                              className="opacity-40 hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="點擊修改組名"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </h4>
                        </div>
                      )}

                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${theme.bg} ${theme.text}`}>
                        {group.students.length} 人
                      </span>
                    </div>

                    {/* Students List in Group */}
                    <div className="space-y-1.5 min-h-[90px]">
                      {group.students.map((student) => {
                        const isSelected =
                          selectedStudentToMove?.student.id === student.id;

                        return (
                          <div
                            key={student.id}
                            className={`flex items-center justify-between p-2 rounded-xl transition-all text-xs ${
                              isSelected
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                                : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                {student.seatNumber || '#'}
                              </span>
                              <span className="font-medium text-slate-800 truncate">
                                {student.name}
                              </span>
                            </div>

                            {/* Move Student Trigger */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) {
                                  setSelectedStudentToMove(null);
                                } else {
                                  setSelectedStudentToMove({
                                    groupId: group.id,
                                    student,
                                  });
                                }
                              }}
                              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'text-amber-800 hover:bg-amber-200'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                              }`}
                              title={isSelected ? '取消選取' : '換組或移動同學'}
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}

                      {group.students.length === 0 && (
                        <div className="py-6 text-center text-xs text-slate-400 border border-dashed rounded-xl border-slate-200">
                          此組目前無成員
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Group Card Footer / Move hint */}
                  {isTargetGroupForMove && (
                    <div className="mt-3 pt-2 text-center border-t border-indigo-200 text-xs font-semibold text-indigo-700 animate-pulse">
                      點擊將同學移入此組 ↵
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Initial Empty State before first group generation */}
      {groups.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Shuffle className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800">尚未執行分組</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            確認上方「每組幾人」等設定後，點擊「開始自動分組」按鈕，系統將以動畫呈現分組結果！
          </p>
        </div>
      )}
    </div>
  );
}

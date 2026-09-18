import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Student } from '../types';
import { parseRosterInput, exportRosterToCsv, SAMPLE_STUDENTS } from '../utils/rosterParser';
import { 
  UploadCloud, 
  ClipboardPaste, 
  FileSpreadsheet, 
  UserPlus, 
  Trash2, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  AlertCircle,
  Users,
  Search
} from 'lucide-react';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onNavigateToDraw?: () => void;
  onNavigateToGroup?: () => void;
}

export default function RosterManager({
  students,
  onUpdateStudents,
  onNavigateToDraw,
  onNavigateToGroup,
}: RosterManagerProps) {
  const [pasteText, setPasteText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSeat, setNewStudentSeat] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File drag & drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseRosterInput(text);
        if (parsed.length > 0) {
          onUpdateStudents(parsed);
          setImportNotice(`成功從檔案「${file.name}」匯入 ${parsed.length} 位學生！`);
          setTimeout(() => setImportNotice(null), 4000);
        } else {
          setImportNotice('檔案解析未找到任何有效姓名，請檢查檔案內容。');
          setTimeout(() => setImportNotice(null), 4000);
        }
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Paste text import
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const parsed = parseRosterInput(pasteText);
    if (parsed.length > 0) {
      onUpdateStudents(parsed);
      setImportNotice(`成功匯入 ${parsed.length} 位學生！`);
      setPasteText('');
      setTimeout(() => setImportNotice(null), 4000);
    } else {
      setImportNotice('請輸入有效的學生姓名。');
      setTimeout(() => setImportNotice(null), 4000);
    }
  };

  // Load sample class
  const handleLoadSample = () => {
    onUpdateStudents(SAMPLE_STUDENTS);
    setImportNotice(`已成功載入示範班級名單（共 ${SAMPLE_STUDENTS.length} 位學生）！`);
    setTimeout(() => setImportNotice(null), 4000);
  };

  // Add individual student
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const nextSeat = newStudentSeat.trim() 
      ? parseInt(newStudentSeat, 10) 
      : students.length > 0 
        ? Math.max(...students.map((s) => s.seatNumber || 0)) + 1 
        : 1;

    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newStudentName.trim(),
      seatNumber: isNaN(nextSeat) ? students.length + 1 : nextSeat,
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
    setNewStudentSeat('');
  };

  // Remove single student
  const handleRemoveStudent = (id: string) => {
    onUpdateStudents(students.filter((s) => s.id !== id));
  };

  // Clear all
  const handleClearAll = () => {
    if (confirm('確定要清空目前的名單嗎？')) {
      onUpdateStudents([]);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (students.length === 0) return;
    const csvContent = exportRosterToCsv(students);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy names to clipboard
  const handleCopyNames = () => {
    if (students.length === 0) return;
    const text = students.map((s) => `${s.seatNumber ? s.seatNumber + '. ' : ''}${s.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Duplicate names detection
  const duplicateNames = students
    .map((s) => s.name)
    .filter((name, idx, arr) => arr.indexOf(name) !== idx && arr.lastIndexOf(name) === idx);

  // Filtered students for search
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.seatNumber && s.seatNumber.toString().includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {importNotice && (
        <div 
          id="import-notice-banner"
          className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-fadeIn shadow-sm"
        >
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Top Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              目前名單庫
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                {students.length} 位學生
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              名單將直接用於「隨機點名抽籤」與「自動分組」功能
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-load-sample"
            onClick={handleLoadSample}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            載入示範名單 (28人)
          </button>

          {students.length > 0 && (
            <>
              <button
                id="btn-export-csv"
                onClick={handleExportCsv}
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                title="匯出為 CSV 檔案"
              >
                <Download className="w-3.5 h-3.5" />
                匯出 CSV
              </button>
              <button
                id="btn-copy-roster"
                onClick={handleCopyNames}
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                title="複製純文字名單"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已複製！' : '複製名單'}
              </button>
              <button
                id="btn-clear-all"
                onClick={handleClearAll}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title="清空目前名單"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空
              </button>
            </>
          )}
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicateNames.length > 0 && (
        <div 
          id="duplicate-warning"
          className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>名單中有重複姓名：{duplicateNames.join('、')}，已為您保留各自抽籤機會。</span>
        </div>
      )}

      {/* Input Sources: 2 Columns (Upload CSV / Paste Text) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source 1: CSV / TXT Upload */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">方法一：上傳 CSV / TXT 檔案</h3>
                <p className="text-xs text-slate-400">支援 Excel 匯出的 CSV 或純文字檔</p>
              </div>
            </div>

            <div
              id="drop-zone-csv"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/60'
                  : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".csv,.txt,.tsv"
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
                <UploadCloud className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                點擊選擇檔案，或將檔案拖曳至此
              </p>
              <p className="text-xs text-slate-400 mt-1">
                支援 .csv 與 .txt 格式（自動辨識「姓名」與「座號」欄位）
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            💡 提示：若 CSV 中有多欄，系統會自動尋找包含「姓名」的欄位作為名單。
          </div>
        </div>

        {/* Source 2: Paste Names Textarea */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ClipboardPaste className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">方法二：直接貼上名單</h3>
                <p className="text-xs text-slate-400">支援每行一人、逗號、頓號或空格分隔</p>
              </div>
            </div>

            <textarea
              id="textarea-paste-roster"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="可直接貼上，例如：&#10;1. 陳冠宇&#10;2. 林書豪&#10;3. 黃怡君&#10;或用逗號分隔：王俊傑, 吳佩珊, 李佳蓉..."
              rows={4}
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              支援「座號. 姓名」格式自動擷取座號
            </span>
            <button
              id="btn-apply-paste"
              onClick={handleParsePaste}
              type="button"
              disabled={!pasteText.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
            >
              解析並匯入
            </button>
          </div>
        </div>
      </div>

      {/* Manual Single Addition & Roster Visual Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">
              學生名單列表
            </h3>
            <span className="text-xs text-slate-500">
              （共 {filteredStudents.length} / {students.length} 位）
            </span>
          </div>

          {/* Quick Search in Roster */}
          {students.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋學生姓名或座號..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          )}
        </div>

        {/* Add Individual Student Form */}
        <form onSubmit={handleAddSingleStudent} className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            value={newStudentSeat}
            onChange={(e) => setNewStudentSeat(e.target.value)}
            placeholder="座號 (選填)"
            className="w-24 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <input
            type="text"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            placeholder="輸入學生姓名..."
            className="flex-1 min-w-[140px] px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!newStudentName.trim()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            新增一位
          </button>
        </form>

        {/* Students Chips / Grid */}
        {students.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600">目前尚無學生名單</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              請從上方上傳 CSV、直接貼上名單，或點擊上方「載入示範名單」快速體驗！
            </p>
            <button
              onClick={handleLoadSample}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              立即載入 28 位示範名單
            </button>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  id={`student-chip-${student.id}`}
                  className="group flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition-all text-xs"
                >
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="w-5 h-5 rounded-md bg-slate-200/70 group-hover:bg-indigo-200/70 text-slate-700 group-hover:text-indigo-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {student.seatNumber || '#'}
                    </span>
                    <span className="font-semibold text-slate-800 truncate" title={student.name}>
                      {student.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveStudent(student.id)}
                    type="button"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    title="移除此學生"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {filteredStudents.length === 0 && searchQuery && (
              <p className="text-center py-6 text-xs text-slate-400">
                找不到符合「{searchQuery}」的學生
              </p>
            )}
          </div>
        )}

        {/* Quick bottom call-to-actions to jump to 功能1 or 功能2 */}
        {students.length > 0 && (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              名單已就緒，可以開始課堂活動：
            </span>
            <div className="flex items-center gap-2">
              {onNavigateToDraw && (
                <button
                  id="btn-goto-draw"
                  onClick={onNavigateToDraw}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                >
                  前往隨機抽籤 (功能1) →
                </button>
              )}
              {onNavigateToGroup && (
                <button
                  id="btn-goto-group"
                  onClick={onNavigateToGroup}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-sm transition-all cursor-pointer"
                >
                  前往自動分組 (功能2) →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

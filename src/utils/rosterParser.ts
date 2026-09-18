import { Student } from '../types';

export const SAMPLE_STUDENTS: Student[] = [
  { id: 'std-1', seatNumber: 1, name: '陳冠宇' },
  { id: 'std-2', seatNumber: 2, name: '林書豪' },
  { id: 'std-3', seatNumber: 3, name: '張家豪' },
  { id: 'std-4', seatNumber: 4, name: '黃怡君' },
  { id: 'std-5', seatNumber: 5, name: '李佳蓉' },
  { id: 'std-6', seatNumber: 6, name: '王俊傑' },
  { id: 'std-7', seatNumber: 7, name: '吳佩珊' },
  { id: 'std-8', seatNumber: 8, name: '劉子豪' },
  { id: 'std-9', seatNumber: 9, name: '蔡佳穎' },
  { id: 'std-10', seatNumber: 10, name: '楊承翰' },
  { id: 'std-11', seatNumber: 11, name: '許庭瑋' },
  { id: 'std-12', seatNumber: 12, name: '鄭雅婷' },
  { id: 'std-13', seatNumber: 13, name: '謝宗翰' },
  { id: 'std-14', seatNumber: 14, name: '洪詩涵' },
  { id: 'std-15', seatNumber: 15, name: '邱建宏' },
  { id: 'std-16', seatNumber: 16, name: '曾品涵' },
  { id: 'std-17', seatNumber: 17, name: '廖柏翰' },
  { id: 'std-18', seatNumber: 18, name: '賴宣妤' },
  { id: 'std-19', seatNumber: 19, name: '徐孟勳' },
  { id: 'std-20', seatNumber: 20, name: '周宇辰' },
  { id: 'std-21', seatNumber: 21, name: '葉芷芸' },
  { id: 'std-22', seatNumber: 22, name: '蘇俊廷' },
  { id: 'std-23', seatNumber: 23, name: '莊凱文' },
  { id: 'std-24', seatNumber: 24, name: '江品萱' },
  { id: 'std-25', seatNumber: 25, name: '呂育誠' },
  { id: 'std-26', seatNumber: 26, name: '何佳玲' },
  { id: 'std-27', seatNumber: 27, name: '羅盛揚' },
  { id: 'std-28', seatNumber: 28, name: '彭歆潔' },
];

/**
 * Parse text or CSV content into a list of Students
 */
export function parseRosterInput(content: string): Student[] {
  if (!content || !content.trim()) return [];

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Check if first line might be a CSV header
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t')
    ? '\t'
    : firstLine.includes(',')
    ? ','
    : firstLine.includes(';')
    ? ';'
    : null;

  const result: Student[] = [];

  if (delimiter) {
    // Delimited (CSV or TSV)
    const headerCells = parseCsvRow(firstLine, delimiter).map((c) => c.toLowerCase().trim());
    
    // Check if header contains keywords for name/seat
    let nameColIndex = -1;
    let seatColIndex = -1;

    headerCells.forEach((header, idx) => {
      if (
        header.includes('姓名') ||
        header.includes('學生') ||
        header === 'name' ||
        header.includes('student')
      ) {
        nameColIndex = idx;
      }
      if (
        header.includes('座號') ||
        header.includes('學號') ||
        header === 'no' ||
        header === 'seat' ||
        header === 'id' ||
        header.includes('號')
      ) {
        seatColIndex = idx;
      }
    });

    let startIdx = 0;
    if (nameColIndex !== -1 || seatColIndex !== -1) {
      // Header row recognized
      startIdx = 1;
      if (nameColIndex === -1) {
        // If seat found but not name, pick the other column
        nameColIndex = seatColIndex === 0 ? 1 : 0;
      }
    } else {
      // No clear header, check column count
      // Default to column 1 if column 0 looks like seat numbers
      const sampleCells = parseCsvRow(firstLine, delimiter);
      if (sampleCells.length >= 2 && /^\d+$/.test(sampleCells[0].trim())) {
        seatColIndex = 0;
        nameColIndex = 1;
      } else {
        nameColIndex = 0;
      }
    }

    for (let i = startIdx; i < lines.length; i++) {
      const cells = parseCsvRow(lines[i], delimiter);
      if (cells.length === 0) continue;

      const rawName = (cells[nameColIndex] || cells[0] || '').trim();
      if (!rawName) continue;

      // Extract seat number if available
      let seat: number | undefined;
      if (seatColIndex !== -1 && cells[seatColIndex]) {
        const num = parseInt(cells[seatColIndex].replace(/\D/g, ''), 10);
        if (!isNaN(num)) seat = num;
      }

      result.push({
        id: `std-${i + 1}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: rawName,
        seatNumber: seat ?? (result.length + 1),
      });
    }
  } else {
    // Free text: might be lines of names, or comma/space/enumeration separated in a single line
    let allTokens: string[] = [];
    
    // Check if the lines have separators like Chinese comma, punctuation, or spaces
    lines.forEach((line) => {
      // Split by common Chinese and Western delimiters
      const tokens = line
        .split(/[,，、;\s\t\n]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      allTokens.push(...tokens);
    });

    // Process tokens into students
    allTokens.forEach((token, index) => {
      // Check if token contains seat number like "01.陳冠宇" or "1號 張大明" or "1-王小明"
      const match = token.match(/^(\d+)[\.\s、\-號#]*(.+)$/);
      if (match) {
        const seat = parseInt(match[1], 10);
        const name = match[2].trim();
        if (name) {
          result.push({
            id: `std-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
            name,
            seatNumber: isNaN(seat) ? index + 1 : seat,
          });
          return;
        }
      }

      result.push({
        id: `std-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
        name: token,
        seatNumber: index + 1,
      });
    });
  }

  // Filter out any invalid items
  return result.filter((s) => s.name.length > 0);
}

/**
 * Parses a single CSV row handling double quotes
 */
function parseCsvRow(row: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Export students list as CSV string
 */
export function exportRosterToCsv(students: Student[]): string {
  const header = '座號,姓名\n';
  const rows = students.map((s, idx) => `${s.seatNumber ?? idx + 1},"${s.name.replace(/"/g, '""')}"`).join('\n');
  return '\uFEFF' + header + rows; // Add UTF-8 BOM for Excel compatibility with Chinese
}

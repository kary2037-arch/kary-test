export interface Student {
  id: string;
  name: string;
  seatNumber?: number;
}

export interface DrawRecord {
  id: string;
  studentId: string;
  studentName: string;
  seatNumber?: number;
  timestamp: string;
  round: number;
}

export interface GroupResult {
  id: string;
  name: string;
  themeColor: string;
  students: Student[];
}

export type RemainderStrategy = 'distribute' | 'separateGroup';

export interface GroupSettings {
  mode: 'bySize' | 'byCount';
  groupSize: number;
  groupCount: number;
  remainderStrategy: RemainderStrategy;
  namingStyle: 'number' | 'color' | 'animal' | 'hero';
}

export interface DrawSettings {
  allowRepeat: boolean;
  animationSpeed: 'fast' | 'normal' | 'suspense'; // 1.5s, 3s, 5s
  soundEnabled: boolean;
  volume: number;
  confettiEnabled: boolean;
}


export interface Level {
  id: number;
  name: string;
  question: string;
  sampleInput?: string;
  sampleOutput?: string;
  isSurprise?: boolean;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  initialLives: number;
  levelCount: number;
  dataFile: string;
}

export interface ModuleWithLevels extends Module {
  levels: Level[];
}


export interface Level {
  id: number;
  name: string;
  question: string;
  isSurprise?: boolean;
}

export interface Module {
  id:string;
  name: string;
  description: string;
  initialLives: number;
  levels: Level[];
}

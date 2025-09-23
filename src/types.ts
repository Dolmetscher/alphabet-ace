
export interface WordOption {
  word: string;
  emoji: string;
}

export interface LetterData {
  letter: string;
  choices: WordOption[];
}

export interface AlphabetItem {
  letter: string;
  word: string;
  emoji: string;
}

export enum GameState {
  Playing,
  Answered,
  GameOver,
}

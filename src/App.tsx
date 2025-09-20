
import React, { useState, useEffect, useCallback } from 'react';
import { ALPHABET_DATA } from './constants';
import { GameState } from './types';
import type { AlphabetItem } from './types';

// Utility function for text-to-speech
const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    // Cancel any ongoing speech to prevent overlap
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } else {
    console.error("Sorry, your browser doesn't support text-to-speech.");
  }
};

// Helper Components (defined outside the main App component)

const ScoreDisplay: React.FC<{ score: number; highScore: number }> = ({ score, highScore }) => (
  <div className="flex justify-between items-center w-full text-lg sm:text-xl font-semibold text-slate-700 mb-6">
    <div className="bg-white/70 backdrop-blur-sm shadow-md rounded-lg px-4 py-2">
      Score: <span className="font-bold text-sky-600">{score}</span>
    </div>
    <div className="bg-white/70 backdrop-blur-sm shadow-md rounded-lg px-4 py-2">
      High Score: <span className="font-bold text-amber-600">{highScore}</span>
    </div>
  </div>
);

const LetterDisplay: React.FC<{ letter: string; onSpeak: (text: string) => void }> = ({ letter, onSpeak }) => (
  <div
    onClick={() => onSpeak(letter)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSpeak(letter);
      }
    }}
    className="mb-8 w-40 h-40 sm:w-48 sm:h-48 bg-white rounded-2xl shadow-xl flex items-center justify-center cursor-pointer transform transition-transform hover:scale-105 active:scale-95"
    role="button"
    tabIndex={0}
    aria-label={`Letter ${letter}. Click to hear the letter.`}
  >
    <h1 className="text-8xl sm:text-9xl font-bold text-slate-800 select-none pointer-events-none">{letter}</h1>
  </div>
);


interface OptionCardProps {
  item: AlphabetItem;
  onClick: (item: AlphabetItem) => void;
  isSelected: boolean;
  isCorrect: boolean | null;
  isRevealed: boolean;
  correctAnswer: AlphabetItem;
}

const OptionCard: React.FC<OptionCardProps> = ({ item, onClick, isSelected, isCorrect, isRevealed, correctAnswer }) => {
  const isTheCorrectAnswer = item.word === correctAnswer.word;

  const getCardStyle = () => {
    if (isRevealed) {
      if (isTheCorrectAnswer) {
        return 'border-green-500 bg-green-100 scale-105 shadow-lg';
      }
      if (isSelected && !isCorrect) {
        return 'border-red-500 bg-red-100 opacity-60';
      }
      return 'opacity-60';
    }
    return 'border-transparent bg-white hover:border-sky-400 hover:scale-105';
  };

  return (
    <button
      onClick={() => onClick(item)}
      disabled={isRevealed}
      className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-lg border-4 transition-all duration-300 transform ${getCardStyle()}`}
      aria-label={item.word}
    >
      <span className="text-6xl sm:text-7xl mb-2 pointer-events-none">{item.emoji}</span>
      <span className="text-lg sm:text-xl font-medium text-slate-700 pointer-events-none">{item.word}</span>
    </button>
  );
};

const GameOverScreen: React.FC<{ score: number; highScore: number; onPlayAgain: () => void }> = ({ score, highScore, onPlayAgain }) => (
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full animate-fade-in">
      <h2 className="text-4xl font-bold text-slate-800 mb-2">Game Over!</h2>
      <p className="text-slate-600 mb-6 text-lg">You did a great job!</p>
      <div className="space-y-4 mb-8">
        <div className="bg-slate-100 p-4 rounded-lg">
          <p className="text-slate-500">Your Score</p>
          <p className="text-4xl font-bold text-sky-600">{score}</p>
        </div>
        {score === highScore && score > 0 && (
          <div className="bg-amber-100 p-4 rounded-lg animate-pulse">
            <p className="text-amber-600 font-semibold">New High Score!</p>
          </div>
        )}
      </div>
      <button
        onClick={onPlayAgain}
        className="w-full bg-sky-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-sky-600 transition-colors transform hover:scale-105"
      >
        Play Again
      </button>
    </div>
  </div>
);

// Main App Component
const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Playing);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [questions, setQuestions] = useState<AlphabetItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState<AlphabetItem[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<AlphabetItem | null>(null);
  
  const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const generateQuestion = useCallback((qIndex: number, allQuestions: AlphabetItem[]) => {
    if (qIndex >= allQuestions.length) {
      setGameState(GameState.GameOver);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('alphabetAceHighScore', score.toString());
      }
      return;
    }
    
    const correctAnswer = allQuestions[qIndex];
    const wrongAnswers = ALPHABET_DATA.filter(item => item.letter !== correctAnswer.letter);
    const shuffledWrong = shuffleArray(wrongAnswers).slice(0, 3);
    const newOptions = shuffleArray([correctAnswer, ...shuffledWrong]);
    
    setOptions(newOptions);
    setSelectedAnswer(null);
  }, [score, highScore]);

  const startGame = useCallback(() => {
    const shuffledQuestions = shuffleArray(ALPHABET_DATA);
    setQuestions(shuffledQuestions);
    setScore(0);
    setCurrentQuestionIndex(0);
    setGameState(GameState.Playing);
    generateQuestion(0, shuffledQuestions);
  }, [generateQuestion]);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('alphabetAceHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOptionClick = (item: AlphabetItem) => {
    if (gameState === GameState.Answered) return;

    speak(item.word);
    setSelectedAnswer(item);
    const correctAnswer = questions[currentQuestionIndex];
    if (item.word === correctAnswer.word) {
      setScore(prev => prev + 1);
    }
    setGameState(GameState.Answered);
  };
  
  const handleNextQuestion = () => {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setGameState(GameState.Playing);
      generateQuestion(nextIndex, questions);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswerCorrect = selectedAnswer && currentQuestion && selectedAnswer.word === currentQuestion.word;

  return (
    <main className="min-h-screen bg-sky-100 font-sans flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md mx-auto flex flex-col items-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Alphabet Ace</h1>
        <p className="text-slate-500 mb-6">Match the letter!</p>
        
        {currentQuestion && gameState !== GameState.GameOver && (
          <>
            <ScoreDisplay score={score} highScore={highScore} />
            <LetterDisplay letter={currentQuestion.letter} onSpeak={speak} />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">
              {options.map(item => (
                <OptionCard
                  key={item.word}
                  item={item}
                  onClick={handleOptionClick}
                  isSelected={selectedAnswer?.word === item.word}
                  isCorrect={isAnswerCorrect}
                  isRevealed={gameState === GameState.Answered}
                  correctAnswer={currentQuestion}
                />
              ))}
            </div>
            {gameState === GameState.Answered && (
                <button 
                  onClick={handleNextQuestion}
                  className="mt-8 w-full bg-amber-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-amber-600 transition-colors transform hover:scale-105"
                >
                  Next
                </button>
            )}
          </>
        )}

        {gameState === GameState.GameOver && (
          <GameOverScreen score={score} highScore={highScore} onPlayAgain={startGame} />
        )}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </main>
  );
};

export default App;

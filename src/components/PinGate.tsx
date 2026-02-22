import { useState, useEffect, type ReactNode } from 'react';
import { Delete } from 'lucide-react';

interface PinGateProps {
  children: ReactNode;
}

const CORRECT_PIN = '032726';

export default function PinGate({ children }: PinGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('pinUnlocked');
    if (stored === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleSubmit = () => {
    if (pin.length === 6) {
      if (pin === CORRECT_PIN) {
        localStorage.setItem('pinUnlocked', 'true');
        setIsUnlocked(true);
      } else {
        setShake(true);
        setError('Incorrect code');
        setPin('');
        setTimeout(() => setShake(false), 500);
      }
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sage-100 to-rose-50 flex flex-col items-center justify-center p-4 z-50">
      <div className="flex flex-col items-center gap-8 max-w-sm">
        {/* Baby bottle emoji */}
        <div className="text-6xl">🍼</div>

        <h1 className="font-display font-800 text-gray-800 text-2xl text-center">
          Welcome back!
        </h1>

        {/* PIN display dots */}
        <div className="flex gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center font-display font-700 ${
                i < pin.length
                  ? 'bg-rose-200 border-rose-300 text-rose-700'
                  : 'bg-white border-cream-300'
              }`}
            >
              {i < pin.length && '●'}
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div
            className={`text-center font-display font-600 text-rose-600 transition-all duration-300 ${
              shake ? 'animate-bounce' : ''
            }`}
          >
            {error}
          </div>
        )}

        {/* Numeric keypad */}
        <div className={`grid grid-cols-3 gap-3 w-full transition-transform duration-300 ${shake ? 'scale-95' : ''}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(String(digit))}
              className="h-14 bg-white border border-cream-300 rounded-xl font-display font-700 text-lg text-gray-800 hover:bg-cream-100 active:bg-cream-200 transition-colors"
            >
              {digit}
            </button>
          ))}

          {/* 0 */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 bg-white border border-cream-300 rounded-xl font-display font-700 text-lg text-gray-800 hover:bg-cream-100 active:bg-cream-200 transition-colors col-span-2"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleBackspace}
            className="h-14 bg-warm-gray border border-cream-300 rounded-xl text-gray-800 hover:bg-gray-300 active:bg-gray-400 transition-colors flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={pin.length !== 6}
          className="w-full h-12 bg-gradient-to-r from-sage-400 to-rose-300 text-white font-display font-700 rounded-xl hover:shadow-lg active:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Unlock
        </button>

        <p className="text-xs text-gray-600 text-center mt-4">
          Enter your 6-digit PIN to access Team Luca's tracker
        </p>
      </div>
    </div>
  );
}

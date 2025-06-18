// context/DesignContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

// On passe de selectedColor à selectedColors (tableau de couleurs)
interface DesignContextType {
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPattern: File | null;
  setSelectedPattern: React.Dispatch<React.SetStateAction<File | null>>;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

interface UsePersistentStateReturn<T> extends Array<T | ((value: T) => void)> {
    0: T;
    1: React.Dispatch<React.SetStateAction<T>>;
}

function usePersistentState<T>(key: string, initialValue: T): UsePersistentStateReturn<T> {
    const [value, setValue] = useState<T>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(key);
            try {
                return stored !== null ? JSON.parse(stored) as T : initialValue;
            } catch {
                return initialValue;
            }
        }
        return initialValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}

type DesignProviderProps = {
  children: React.ReactNode;
};

export function DesignProvider({ children }: DesignProviderProps) {
  // Par défaut, deux couleurs (modifiable selon ton besoin)
  const [selectedColors, setSelectedColors] = usePersistentState('selectedColors', ['#ffffff', '#000000']);
  const [selectedPattern, setSelectedPattern] = useState<File | null>(null); // File objects can't be stored in localStorage

  return (
    <DesignContext.Provider value={{ selectedColors, setSelectedColors, selectedPattern, setSelectedPattern }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
}
// components/DesignContext.tsx
'use client';
import { createContext, useContext, useEffect, useState, ChangeEvent } from 'react';
import { Colorant } from './CIESphere';

// On passe de selectedColor à selectedColors (tableau de couleurs)
interface DesignContextType {
    selectedColors: string[];
    setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
    selectedDatabase: File | null;
    setSelectedDatabase: React.Dispatch<React.SetStateAction<File | null>>;
    selectedPattern: File | null;
    setSelectedPattern: React.Dispatch<React.SetStateAction<File | null>>;
    requiredColorCount: number;
    setRequiredColorCount: React.Dispatch<React.SetStateAction<number>>;
    designColorants: Colorant[];
    setDesignColorants: React.Dispatch<React.SetStateAction<Colorant[]>>;
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
                return stored !== null ? (JSON.parse(stored) as T) : initialValue;
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
    const [selectedColors, setSelectedColors] = usePersistentState('selectedColors', [
        '#ffffff',
        '#000000',
    ]);
    const [selectedPattern, setSelectedPattern] = useState<File | null>(null); // File objects can't be stored in localStorage
    const [selectedDatabase, setSelectedDatabase] = useState<File | null>(null); // File objects can't be stored in localStorage
    const [requiredColorCount, setRequiredColorCount] = useState<number>(2);

    return (
        <DesignContext.Provider
            value={{
                selectedColors,
                setSelectedColors,
                selectedDatabase,
                setSelectedDatabase,
                selectedPattern,
                setSelectedPattern,
                requiredColorCount,
                setRequiredColorCount,
            }}
        >
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

function PatternPicker() {
    const { selectedPattern, setSelectedPattern } = useDesign();

    function handlePatternChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            setSelectedPattern(e.target.files[0]);
        }
    }
    return (
        <div className="mb-4">
            <label className="block mb-2 font-semibold">Choose a pattern:</label>
            <input type="file" accept="image/*" onChange={handlePatternChange} />
            {selectedPattern && (
                <div className="mt-2 text-sm text-green-500">Selected: {selectedPattern.name}</div>
            )}
        </div>
    );
}
function ColorantPicker() {
    const { selectedColors, setSelectedColors } = useDesign();

    function handleColorChange(index: number, color: string) {
        const newColors = [...selectedColors];
        newColors[index] = color;
        setSelectedColors(newColors);
    }

    function addColor() {
        setSelectedColors([...selectedColors, '#ffffff']);
    }

    function removeColor(index: number) {
        setSelectedColors(selectedColors.filter((_, i) => i !== index));
    }

    return (
        <div className="mb-4">
            <label className="block mb-2 font-semibold">Choose colorants:</label>
            {selectedColors.map((color, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(i, e.target.value)}
                    />
                    <span className="text-xs">{color}</span>
                    {selectedColors.length > 1 && (
                        <button
                            className="text-red-500"
                            onClick={() => removeColor(i)}
                            type="button"
                        >
                            Remove
                        </button>
                    )}
                </div>
            ))}
            <button
                className="mt-2 px-2 py-1 bg-blue-600 text-white rounded"
                onClick={addColor}
                type="button"
            >
                Add color
            </button>
        </div>
    );
}

// --- Preview of current selection ---
function DesignSummary() {
    const { selectedPattern, selectedColors } = useDesign();
    return (
        <div className="mt-6 p-4 border rounded">
            <h3 className="font-semibold mb-2">Current selection:</h3>
            <div>
                <strong>Pattern:</strong> {selectedPattern ? selectedPattern.name : 'None'}
            </div>
            <div className="flex gap-2 mt-2">
                <strong>Colors:</strong>
                {selectedColors.map((color, i) => (
                    <span
                        key={i}
                        style={{
                            background: color,
                            display: 'inline-block',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            border: '1px solid #ccc',
                        }}
                        title={color}
                    />
                ))}
            </div>
        </div>
    );
}

// --- Main Demo Component ---
export default function DesignDemo() {
    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-neutral-900 rounded-xl text-white">
            <h2 className="text-2xl font-bold mb-6">Design your cloth</h2>
            <PatternPicker />
            <ColorantPicker />
            <DesignSummary />
        </div>
    );
}

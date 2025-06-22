'use client';

import dynamic from 'next/dynamic';
import { ColorEntry, parseCSVText } from '@/components/color_handling';
import { useEffect, useState } from 'react';
import { useDesign } from '@/components/DesignContextProvider';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

const CIESphere = dynamic(() => import('@/components/CIESphere'), {
    ssr: false,
});

import { ColorButton } from '@/components/ExcelButton';
import { FileIcon } from 'lucide-react';
import { SettingSlider, SettingCheckbox } from '@/components/SettingSlider';

// function Settings() {
//     return (
//         <div style={{ width: '200px', background: '#111', padding: '1rem' }}>
//             <h3 className="font-bold">Open your CSV file containing colorants</h3>
//             <br />
//             <div className="flex flex-row">
//                 <ColorButton setParsedData={setParsedData} setSeeAll={setSeeAllColorants} />
//                 {tableau_test && (
//                     <>
//                         <div className="flex flex-col pl-2">
//                             See all
//                             <input
//                                 type="checkbox"
//                                 className="ml-2"
//                                 aria-label=".5a"
//                                 checked={seeAllColorants}
//                                 onChange={() => setSeeAllColorants((prev) => !prev)}
//                             />
//                         </div>
//                     </>
//                 )}
//             </div>
//             {tableau_test && (
//                 <>
//                     <br />
//                     <br />
//                     <h3>Suggested Colors</h3>
//                     {suggestedColors.map((hex, i) => (
//                         <div
//                             key={String(i) + '_' + String(i) + '_' + String(i)}
//                             onClick={() => {
//                                 if (!colorValidated) {
//                                     setSelectedColor(hex);
//                                     points.forEach((point) => {
//                                         if (selectedColor === point.color) {
//                                             setSelectedPosition(
//                                                 new THREE.Vector3(...point.position)
//                                             );
//                                         }
//                                     });
//                                 }
//                             }}
//                             style={{
//                                 background: hex.getStyle(),
//                                 height: '30px',
//                                 width: '100%',
//                                 marginBottom: '10px',
//                                 cursor: 'pointer',
//                             }}
//                         />
//                     ))}
//                 </>
//             )}
//             {selectedColor && (
//                 <>
//                     <h4>Selected Color</h4>
//                     <div
//                         style={{
//                             background: `#${selectedColor.getHexString()}`,
//                             height: 30,
//                         }}
//                     ></div>
//                     <label>Bubble Size</label>
//                     <input
//                         type="range"
//                         min={0.0}
//                         max={0.15}
//                         step={0.005}
//                         value={selectedSize}
//                         onChange={(e) => setSelectedSize(parseFloat(e.target.value))}
//                         style={{ width: '100%' }}
//                     />
//                 </>
//             )}
//             {selectedColor && (
//                 <>
//                     <label>Selection Tolerance</label>
//                     <input
//                         type="range"
//                         min={0.01}
//                         max={0.5}
//                         step={0.005}
//                         value={tolerance}
//                         onChange={(e) => setTolerance(parseFloat(e.target.value))}
//                         style={{ width: '100%' }}
//                     />
//                 </>
//             )}
//             {selectedColor && !colorValidated && (
//                 <>
//                     <input
//                         type="button"
//                         defaultValue="Validate selection"
//                         onClick={() => setColorValidated(true)}
//                         style={{ width: '100%', background: 'dimgrey' }}
//                     />
//                 </>
//             )}
//             {colorValidated && (
//                 <>
//                     <br />
//                     <br />
//                     <input
//                         type="button"
//                         defaultValue="Change selection"
//                         onClick={() => setColorValidated(false)}
//                         style={{ width: '100%', background: 'dimgrey' }}
//                     />
//                 </>
//             )}
//         </div>
//     );
// }

function PlaceholderLoadFile({ setFile }: { setFile: (file: File) => void }) {
    const callback = (file: File) => {
        setFile(file);
    };

    return (
        <ColorButton callback={callback}>
            <FileIcon /> Open File
        </ColorButton>
    );
}

function CIESelect() {
    const { requiredColorCount, selectedDatabase } = useDesign();
    const [currentSelectedColors, setCurrentSelectedColors] = useState<ColorEntry[]>([]);
    const [tolerance, setTolerance] = useState(30);
    const [seeAllColorants, setSeeAllColorants] = useState(false);

    const [db, setDb] = useState<ColorEntry[]>([]);

    const suggestedColors = [
        points[1147].color,
        points[242].color,
        points[40].color,
        points[198].color,
        points[960].color,
        points[209].color,
    ];

    useEffect(() => {
        async function parseData() {
            const txt = await selectedDatabase?.text();
            if (txt !== undefined) {
                setDb(parseCSVText(txt));
            }
        }
        parseData();
    }, [selectedDatabase]);

    // Only allow selection up to requiredColorCount
    function handleColorChange(newColors: ColorEntry[]) {
        if (newColors.length <= requiredColorCount) {
            setCurrentSelectedColors(newColors);
        }
    }

    return (
        <>
            {db.length > 0 ? (
                <CIESphere
                    colorantsDatabase={db}
                    tolerance={tolerance}
                    current_selectedColors={currentSelectedColors}
                    setCurrentSelectedColors={handleColorChange}
                    maxColors={requiredColorCount}
                    seeAllColorants={seeAllColorants}
                />
            ) : (
                <div>Loading...</div>
            )}

            <ResizablePanelGroup
                direction="horizontal"
                className="fixed bottom-2 left-2 right-2 top-2 w-auto! h-auto! pointer-events-none"
            >
                <ResizablePanel
                    defaultSize={85}
                    className="flex flex-col place-items-center justify-end"
                >
                    <div className="px-2 py-2 rounded-xl bg-neutral-200/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto">
                        Settings
                        {/* <Settings /> */}
                    </div>
                </ResizablePanel>
                <ResizableHandle className="bg-transparent" />
                <ResizablePanel
                    defaultSize={15}
                    className="rounded-xl px-8 py-4 bg-neutral-200/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto"
                >
                    {/* <div className="fixed rounded-xl right-2 top-2 bottom-2 px-8 py-4 bg-neutral-200/80 backdrop-blur flex flex-col items-center z-10"> */}
                    <div className="flex flex-col w-full">
                        <SettingSlider
                            value={tolerance}
                            setValue={setTolerance}
                            min={0}
                            max={200}
                            step={0.1}
                        >
                            Tolerance
                        </SettingSlider>

                        <SettingCheckbox value={seeAllColorants} setValue={setSeeAllColorants}>
                            See all colorants
                        </SettingCheckbox>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </>
    );
}

export default function Home() {
    const { selectedDatabase, setSelectedDatabase } = useDesign();

    const setFile = (file: File) => {
        setSelectedDatabase(file);
    };

    return (
        <main className="w-dvw h-dvh flex flex-col">
            {selectedDatabase == undefined ? (
                <div className="w-dvw h-dvh flex flex-row place-items-center justify-center">
                    <PlaceholderLoadFile setFile={setFile} />
                </div>
            ) : (
                <CIESelect />
            )}

            {/* <div className="text-white text-center mb-4 mt-8">
                <h2 className="text-2xl font-bold mb-2">
                    Pick {requiredColorCount} color{requiredColorCount > 1 ? 's' : ''} for your
                    pattern
                </h2>
                <p className="mb-2">
                    {currentSelectedColors.length}/{requiredColorCount} selected
                </p>
            </div> */}

            {/* <div
                style={{
                    visibility:
                        currentSelectedColors.length === requiredColorCount ? 'visible' : 'hidden',
                    marginTop: 24,
                    textAlign: 'center',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: 'black',
                }}
            >
                <button
                    className="bg-blue-600 px-4 py-2 rounded text-white"
                    onClick={handleContinue}
                >
                    Continue
                </button>
            </div> */}
        </main>
    );
}

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
import { ColorTranslator } from 'colortranslator';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

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
    const { requiredColorCount, selectedDatabase, designColorants, setDesignColorants } =
        useDesign();
    const [tolerance, setTolerance] = useState(30);
    const [seeAllColorants, setSeeAllColorants] = useState(false);

    const [db, setDb] = useState<ColorEntry[]>([]);

    const router = useRouter();

    const maxiHoursDisplayed = Math.max(
        ...designColorants.flatMap((c) => c.points.map((c2) => c2.hours))
    );

    // const suggestedColors = [
    //     points[1147].color,
    //     points[242].color,
    //     points[40].color,
    //     points[198].color,
    //     points[960].color,
    //     points[209].color,
    // ];

    useEffect(() => {
        async function parseData() {
            const txt = await selectedDatabase?.text();
            if (txt !== undefined) {
                setDb(parseCSVText(txt));
            }
        }
        parseData();
    }, [selectedDatabase]);

    // Handler to remove colorant by id
    function handleRemoveColorant(id: number) {
        setDesignColorants(designColorants.filter((c) => c.id !== id));
    }

    return (
        <>
            {db.length > 0 ? (
                <CIESphere
                    colorantsDatabase={db}
                    tolerance={tolerance}
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
                    <div className="px-2 py-2 rounded-xl bg-neutral-400/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto">
                        Settings
                        {/* <Settings /> */}
                    </div>
                </ResizablePanel>
                <ResizableHandle className="bg-transparent" />
                <ResizablePanel
                    defaultSize={15}
                    className="rounded-xl px-8 py-4 bg-neutral-400/80 backdrop-blur-2xl flex flex-col items-center z-10 pointer-events-auto"
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

                        {designColorants.length > 0 && (
                            <div className="flex flex-col place-content-start pr-2">
                                <h4 className="self-center">
                                    Ongoing selection of colorants <br />
                                    (gradient on {maxiHoursDisplayed} hours):
                                </h4>
                                {designColorants.map((id_select, i) => {
                                    const colorantData =
                                        db?.filter((d2) => d2.id === id_select.id) || [];
                                    const maxHours =
                                        colorantData.length > 0
                                            ? Math.max(...colorantData.map((d2) => d2.hours))
                                            : 1;
                                    const gradientStops = colorantData.map((d2) => {
                                        const col = new ColorTranslator({
                                            L: d2.L,
                                            a: d2.a,
                                            b: d2.b,
                                        });
                                        return `${col.RGB}`;
                                    });
                                    return (
                                        <>
                                            <div
                                                key={i + '_container'}
                                                className="flex flex-row pb-3 pt-2"
                                            >
                                                <button
                                                    onClick={() =>
                                                        handleRemoveColorant(id_select.id)
                                                    }
                                                    className="pr-2"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        fill="red"
                                                        className="bi bi-trash-fill ml-2"
                                                        viewBox="0 0 16 16"
                                                    >
                                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                                                    </svg>
                                                </button>
                                                <div
                                                    key={String(i) + '_gradient'}
                                                    className="rounded-md"
                                                    style={{
                                                        background: `linear-gradient(to right, ${gradientStops.join(
                                                            ', '
                                                        )})`,
                                                        width: `${
                                                            (maxHours * 210) / maxiHoursDisplayed
                                                        }px`,
                                                        height: '20px',
                                                    }}
                                                ></div>
                                            </div>
                                        </>
                                    );
                                })}
                            </div>
                        )}

                        <Button
                            onClick={() => {
                                router.push('/CIE/preview');
                            }}
                        >
                            Use my colors
                        </Button>
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
        <main className="w-dvw h-dvh flex flex-col bg-black">
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

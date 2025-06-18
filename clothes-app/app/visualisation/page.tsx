import WovenTextureViewer from "@/components/WovenTextureViewer";

export default function Page() {
  return (
    <div>
      <h1 className="text-xl font-bold p-4">Visualiseur de Tissu</h1>
      <WovenTextureViewer imageSrc="/motif.png" />
    </div>
  );
}

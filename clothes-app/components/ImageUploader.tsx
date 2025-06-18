// components/ImageUploader.tsx
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function ImageUploader({ onImage }: { onImage: (img: string) => void }) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onImage(reader.result);
    };
    reader.readAsDataURL(acceptedFiles[0]);
  }, [onImage]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  return (
    <div {...getRootProps()} className="border p-4 text-center cursor-pointer">
      <input {...getInputProps()} />
      <p>Dépose ton motif pixel ici ou clique pour choisir une image.</p>
    </div>
  );
}

import Image from 'next/image';
import textureImage from '../../public/texture.jpg';

// Example usage in a component
export default function TexturePage() {
  return (
    <div>
      <h1>Texture Preview</h1>
      <Image src={textureImage} alt="Texture" width={500} height={500} />
    </div>
  );
}

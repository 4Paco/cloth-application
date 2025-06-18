'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const handleStartNow = () => {
    router.push('/login'); // Redirection vers la page de connexion
  };
  const handleExplorePalettes = () => {
    router.push('/palettes'); // Redirection vers la page des palettes
  };
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 md:py-20">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Créez la combinaison parfaite de couleurs <br />
          pour vos tissus et textures
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Une plateforme pensée pour les designers textile et surface designers. 
          Inspirez-vous, testez des palettes et trouvez les harmonies qui vous correspondent.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" className="bg-white text-black hover:bg-gray-200" onClick={handleStartNow}>
            Démarrer maintenant
          </Button>
          <Button size="lg" className="bg-white text-black hover:bg-gray-200" onClick={handleExplorePalettes}>
            Explorer les palettes
          </Button>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {[
          { title: 'Toile minimaliste', src: '/samples/sample1.jpg' },
          { title: 'Motif floral moderne', src: '/samples/sample2.jpg' },
          { title: 'Tissu à motifs géométriques', src: '/samples/sample3.jpg' },
        ].map(({ title, src }) => (
          <div key={src} className="rounded-2xl overflow-hidden bg-zinc-900 shadow-md group">
            <div className="relative h-64">
              <Image
                src={src}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="px-4 py-3">
              <h3 className="font-semibold text-lg text-white">{title}</h3>
              <p className="text-sm text-gray-400">Exemple de palette appliquée</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} ColorTextile — conçu pour les artistes et les créateurs visuels.
      </div>
    </div>
  );
}

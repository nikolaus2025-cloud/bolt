import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Main Image */}
      <div className="relative aspect-square mb-4 bg-white">
        <img
          src={images[currentIndex]}
          alt={`Product image ${currentIndex + 1}`}
          className="object-contain w-full h-full"
        />
      </div>

      {/* Thumbnails and Arrows Container */}
      <div className="flex items-center gap-4">
        {/* Left Arrow */}
        <button
          onClick={prevImage}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        {/* Thumbnails */}
        <div className="flex-1 flex gap-2 overflow-x-auto py-2">
          {images.map((image: string, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                currentIndex === index ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={nextImage}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    </div>
  );
} 
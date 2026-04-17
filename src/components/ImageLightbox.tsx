import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

const ImageLightbox = ({ 
  images, 
  initialIndex = 0, 
  isOpen, 
  onClose,
  alt = "Product image"
}: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 bg-background/95 backdrop-blur-sm border-border">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background text-foreground"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Main Image */}
        <div className="relative w-full aspect-square md:aspect-video flex items-center justify-center p-4">
          <img
            src={images[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
            loading="lazy"
            decoding="async"/>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground h-12 w-12"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground h-12 w-12"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 justify-center p-4 pt-0 overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  idx === currentIndex 
                    ? "border-secondary ring-2 ring-secondary/30" 
                    : "border-transparent hover:border-muted-foreground/50"
                }`}
              >
                <img
                  src={img}
                  alt={`${alt} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"/>
              </button>
            ))}
          </div>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="text-center pb-4 text-sm text-muted-foreground">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;

import { useState, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  fallbackSrc?: string;
}

/**
 * Image with an animated blurred skeleton placeholder shown until the image loads.
 * Use as a drop-in replacement for <img>. Pass className to style the image itself,
 * and wrapperClassName to style the surrounding wrapper.
 *
 * If the primary `src` fails to load, swaps to `fallbackSrc` (when provided)
 * to avoid showing a broken-image icon.
 */
const BlurImage = ({
  className,
  wrapperClassName,
  onLoad,
  onError,
  loading = "lazy",
  decoding = "async",
  alt = "",
  src,
  fallbackSrc,
  ...props
}: BlurImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setLoaded(false);
    setErrored(false);
  }, [src]);

  return (
    <span className={cn("relative block overflow-hidden", wrapperClassName)}>
      {!loaded && (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted backdrop-blur-md"
        />
      )}
      <img
        {...props}
        src={currentSrc as string | undefined}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          if (!errored && fallbackSrc && currentSrc !== fallbackSrc) {
            setErrored(true);
            setCurrentSrc(fallbackSrc);
            return;
          }
          setLoaded(true);
          onError?.(e);
        }}
        className={cn(
          "transition-all duration-500 ease-out",
          loaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-lg scale-105",
          className
        )}
      />
    </span>
  );
};

export default BlurImage;

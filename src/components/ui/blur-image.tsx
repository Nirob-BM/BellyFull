import { useState, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

/**
 * Image with an animated blurred skeleton placeholder shown until the image loads.
 * Use as a drop-in replacement for <img>. Pass className to style the image itself,
 * and wrapperClassName to style the surrounding wrapper (defaults to "contents").
 */
const BlurImage = ({
  className,
  wrapperClassName,
  onLoad,
  onError,
  loading = "lazy",
  decoding = "async",
  alt = "",
  ...props
}: BlurImageProps) => {
  const [loaded, setLoaded] = useState(false);

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
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
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

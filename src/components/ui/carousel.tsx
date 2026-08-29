import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SlideData {
  title: string;
  button?: string;
  src: string;
  tag?: string;
  description?: string;
  badge?: string;
  link?: string;
  onClick?: () => void;
}

interface CarouselControlProps {
  type: 'previous' | 'next';
  title: string;
  handleClick: () => void;
  disabled?: boolean;
}

const CarouselControl: React.FC<CarouselControlProps> = ({
  type,
  title,
  handleClick,
  disabled
}) => {
  return (
    <button
      type="button"
      className={cn(
        "w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 shadow-lg text-zinc-800 transition-all duration-200 cursor-pointer",
        "hover:bg-zinc-900 hover:text-white hover:scale-105 active:scale-95",
        "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:text-zinc-800 disabled:hover:scale-100"
      )}
      title={title}
      onClick={handleClick}
      disabled={disabled}
      aria-label={title}
    >
      {type === 'previous' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </button>
  );
};

interface SlideProps {
  slide: SlideData;
  index: number;
  widthStyle: string;
  handleSlideClick: (index: number) => void;
}

const Slide: React.FC<SlideProps> = ({
  slide,
  index,
  widthStyle,
  handleSlideClick
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const slideRef = useRef<HTMLLIElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLLIElement>) => {
    const el = slideRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMousePos({
      x: event.clientX - (r.left + r.width / 2),
      y: event.clientY - (r.top + r.height / 2)
    });
  };

  const isVectorImage = slide.src.endsWith('.svg') || slide.src.includes('Landing Page Icons');

  return (
    <li
      ref={slideRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: 0, y: 0 });
      }}
      onClick={() => {
        if (slide.onClick) slide.onClick();
        handleSlideClick(index);
      }}
      style={{ width: widthStyle }}
      className={cn(
        "relative flex-shrink-0 flex flex-col justify-between select-none group",
        "h-[225px] sm:h-[245px] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
        isVectorImage
          ? "bg-white border border-zinc-200/90 shadow-sm hover:shadow-xl hover:border-zinc-300 p-3 sm:p-3.5"
          : "text-white shadow-md hover:shadow-xl"
      )}
    >
      {isVectorImage ? (
        <>
          {/* Top Vector Illustration Frame */}
          <div className="relative w-full h-[105px] sm:h-[115px] rounded-lg sm:rounded-xl bg-zinc-50/90 border border-zinc-100 flex items-center justify-center p-2 overflow-hidden group-hover:bg-zinc-100/70 transition-colors">
            <img
              src={slide.src}
              alt={slide.title}
              className="w-full h-full max-h-[95px] object-contain transition-transform duration-500 group-hover:scale-105 select-none pointer-events-none drop-shadow-xs"
              style={{
                transform: isHovered ? `scale(1.06) translate3d(${mousePos.x / 30}px, ${mousePos.y / 30}px, 0)` : 'scale(1)'
              }}
            />
          </div>

          {/* Bottom Descriptive Copy - Center Aligned to Image with High Visibility */}
          <div className="pt-1.5 flex flex-col items-center justify-center text-center w-full">
            <h3 className="text-sm sm:text-base font-black text-zinc-900 tracking-tight leading-tight mb-0.5 group-hover:text-black transition-colors">
              {slide.title}
            </h3>

            {slide.description && (
              <p className="text-[11px] sm:text-xs text-zinc-800 line-clamp-2 font-medium leading-snug max-w-[96%]">
                {slide.description}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Background Image with Hover Zoom & Parallax */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              backgroundImage: `url(${slide.src})`,
              transform: isHovered
                ? `scale(1.08) translate3d(${mousePos.x / 40}px, ${mousePos.y / 40}px, 0)`
                : 'scale(1)'
            }}
          />

          {/* Multi-layered Dark Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/75" />

          {/* Slide Content */}
          <div className="relative z-20 flex flex-col justify-end items-center text-center h-full p-4 sm:p-5 w-full">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug mb-1 drop-shadow-md group-hover:text-zinc-100 transition-colors">
              {slide.title}
            </h3>

            {slide.description && (
              <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2 font-medium leading-relaxed drop-shadow-sm">
                {slide.description}
              </p>
            )}
          </div>
        </>
      )}
    </li>
  );
};

export interface CarouselProps {
  slides: SlideData[];
  initialSlide?: number;
  onSlideChange?: (index: number) => void;
  className?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  slides,
  initialSlide = 0,
  onSlideChange,
  className
}) => {
  const [visibleCount, setVisibleCount] = useState(3);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const gap = 20; // 20px gap between cards
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  const total = slides.length;
  // Cloned slides: visibleCount from end at start, and visibleCount from start at end
  const cloneCount = Math.max(visibleCount, 1);
  const [currentIndex, setCurrentIndex] = useState(cloneCount + initialSlide);

  // Sync initial slide changes
  useEffect(() => {
    setCurrentIndex(cloneCount + initialSlide);
  }, [cloneCount, initialSlide]);

  const allSlides = React.useMemo(() => {
    if (!slides || slides.length === 0) return [];
    const prefix = slides.slice(-cloneCount);
    const suffix = slides.slice(0, cloneCount);
    return [...prefix, ...slides, ...suffix];
  }, [slides, cloneCount]);

  // Active logical slide index for bullet indicator (0 to total - 1)
  const activeLogicalIndex = ((currentIndex - cloneCount) % total + total) % total;

  const handleNextClick = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      const next = prev + 1;
      const nextLogical = ((next - cloneCount) % total + total) % total;
      if (onSlideChange) onSlideChange(nextLogical);
      return next;
    });
  }, [cloneCount, total, onSlideChange]);

  const handlePreviousClick = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      const next = prev - 1;
      const nextLogical = ((next - cloneCount) % total + total) % total;
      if (onSlideChange) onSlideChange(nextLogical);
      return next;
    });
  }, [cloneCount, total, onSlideChange]);

  const handleSlideClick = (index: number) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitioning(true);
    setCurrentIndex(cloneCount + index);
    if (onSlideChange) onSlideChange(index);
  };

  // Seamless jump without transition on reaching cloned edges
  const handleTransitionEnd = () => {
    isAnimatingRef.current = false;
    if (currentIndex >= cloneCount + total) {
      // Reached right cloned boundary -> snap silently to real first slide
      setIsTransitioning(false);
      setCurrentIndex(currentIndex - total);
    } else if (currentIndex < cloneCount) {
      // Reached left cloned boundary -> snap silently to real last slide
      setIsTransitioning(false);
      setCurrentIndex(currentIndex + total);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handlePreviousClick();
      } else if (event.key === 'ArrowRight') {
        handleNextClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePreviousClick, handleNextClick]);

  if (!slides || slides.length === 0) return null;

  // Exact card width calculation based on visibleCount and gap
  const cardWidthStyle = `calc((100% - ${(visibleCount - 1) * gap}px) / ${visibleCount})`;

  // Exact translation calculation to slide 1 card at a time smoothly
  const trackTransform = `translateX(calc(-${currentIndex} * (((100% - ${(visibleCount - 1) * gap}px) / ${visibleCount}) + ${gap}px)))`;

  return (
    <div className={cn("relative w-full overflow-hidden py-1", className)}>
      {/* Slide Viewport */}
      <div className="relative w-full overflow-hidden">
        <ul
          onTransitionEnd={handleTransitionEnd}
          className={cn(
            "flex items-center list-none p-0 m-0",
            isTransitioning ? "transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]" : "transition-none"
          )}
          style={{
            gap: `${gap}px`,
            transform: trackTransform
          }}
        >
          {allSlides.map((slide, index) => (
            <Slide
              key={`${slide.title}-${index}`}
              slide={slide}
              index={((index - cloneCount) % total + total) % total}
              widthStyle={cardWidthStyle}
              handleSlideClick={() => handleSlideClick(((index - cloneCount) % total + total) % total)}
            />
          ))}
        </ul>
      </div>

      {/* Navigation Controls & Pagination */}
      <div className="flex items-center justify-center gap-5 mt-3 sm:mt-4 relative z-30">
        <CarouselControl
          type="previous"
          title="Previous Slide"
          handleClick={handlePreviousClick}
        />

        {/* Bullet Indicators for Every Slide */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200/80 backdrop-blur-md border border-zinc-300/80 shadow-inner">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSlideClick(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                activeLogicalIndex === idx ? "w-5 bg-zinc-900 shadow-xs" : "w-1.5 bg-zinc-400/80 hover:bg-zinc-600"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <CarouselControl
          type="next"
          title="Next Slide"
          handleClick={handleNextClick}
        />
      </div>
    </div>
  );
};

export function CarouselDemo() {
  const slideData = [
    {
      title: "Mystic Mountains",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1494806812796-244fe51b774d?q=80&w=3534&auto=format&fit=crop",
    },
    {
      title: "Urban Dreams",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1518710843675-2540dd79065c?q=80&w=3387&auto=format&fit=crop",
    },
    {
      title: "Neon Nights",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1590041794748-2d8eb73a571c?q=80&w=3456&auto=format&fit=crop",
    },
    {
      title: "Desert Whispers",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1679420437432-80cfbf88986c?q=80&w=3540&auto=format&fit=crop",
    },
  ];
  return (
    <div className="relative overflow-hidden w-full h-full py-20">
      <Carousel slides={slideData} />
    </div>
  );
}

export default Carousel;
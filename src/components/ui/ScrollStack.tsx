import React, { useLayoutEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import Lenis from 'lenis';
import './ScrollStack.css';

export interface ScrollStackItemProps {
  itemClassName?: string;
  children: ReactNode;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({ children, itemClassName = '' }) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
);

interface ScrollStackProps {
  className?: string;
  children: ReactNode;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
}

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = '',
  itemDistance = 460,
  itemScale = 0.03,
  itemStackDistance = 16,
  stackPosition = '24px',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const lastTransformsRef = useRef(new Map<number, any>());
  const isUpdatingRef = useRef(false);

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(value as string);
  }, []);

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {
        scrollTop: window.scrollY,
        containerHeight: window.innerHeight,
        scrollContainer: document.documentElement
      };
    } else {
      const scroller = scrollerRef.current;
      return {
        scrollTop: scroller!.scrollTop,
        containerHeight: scroller!.clientHeight,
        scrollContainer: scroller!
      };
    }
  }, [useWindowScroll]);

  const getElementOffset = useCallback(
    (element: HTMLElement) => {
      if (useWindowScroll) {
        const rect = element.getBoundingClientRect();
        return rect.top + window.scrollY;
      } else {
        return element.offsetTop;
      }
    },
    [useWindowScroll]
  );

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const { scrollTop, containerHeight } = getScrollData();
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);

    const totalCards = cardsRef.current.length;
    const lastCard = cardsRef.current[totalCards - 1];
    const lastCardTop = lastCard ? getElementOffset(lastCard) : 0;
    const lastCardTargetY = stackPositionPx + itemStackDistance * (totalCards - 1);
    const lastCardPinStart = lastCardTop - lastCardTargetY;
    const pinEnd = Math.max(lastCardPinStart + 60, 100);

    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      const cardTop = getElementOffset(card);
      const targetStackY = stackPositionPx + itemStackDistance * i;
      // First card (i === 0) is locked in place from the very beginning (pinStart = 0)
      const pinStart = i === 0 ? 0 : cardTop - targetStackY;
      const settleRange = 120; // Crisp entry transition with extended per-card reading delay

      let translateY = 0;
      let scale = 1;
      let opacity = 1;

      if (i === 0) {
        // Card 1 is the initial active card: always 100% visible and locked
        translateY = scrollTop <= pinEnd ? scrollTop - cardTop + targetStackY : pinEnd - cardTop + targetStackY;
        scale = 1;
        opacity = 1;
      } else if (scrollTop >= pinStart && scrollTop <= pinEnd) {
        // ─── CARD IS VISUALLY LOCKED IN THE STACK ──────────────────────────
        // Stays 100% motionless in the stack. Visible, full size (1.0), and locked.
        translateY = scrollTop - cardTop + targetStackY;
        scale = 1;
        opacity = 1;
      } else if (scrollTop > pinEnd) {
        // ─── RELEASE PHASE ─────────────────────────────────────────────────
        translateY = pinEnd - cardTop + targetStackY;
        scale = 1;
        opacity = 1;
      } else {
        // ─── INCOMING: MOVE UP, SUSPENDED DELAY, THEN DROP DOWN TO STACK ──
        const distanceToPin = pinStart - scrollTop;
        if (distanceToPin > 0 && distanceToPin <= settleRange) {
          const progress = 1 - distanceToPin / settleRange; // 0.0 (approaching) to 1.0 (landing)
          // Smooth bidirectional fade in & fade out
          opacity = Math.min(1, Math.max(0, Math.pow(progress, 0.7)));

          if (progress < 0.45) {
            // Stage 1: Move Up (Rise with smooth ease-out to the peak)
            const phaseProgress = progress / 0.45;
            const riseEase = 1 - Math.pow(1 - phaseProgress, 2.5);
            translateY = riseEase * -20;
            scale = 1 + riseEase * 0.015;
          } else if (progress < 0.70) {
            // Stage 2: Suspended Delay (Hover/Pause at the peak before dropping)
            const phaseProgress = (progress - 0.45) / 0.25;
            const floatWobble = Math.sin(phaseProgress * Math.PI) * -2;
            translateY = -20 + floatWobble;
            scale = 1.015 + Math.sin(phaseProgress * Math.PI) * 0.003;
          } else {
            // Stage 3: Drop Down to Stack (Descends smoothly and locks onto the deck)
            const phaseProgress = (progress - 0.70) / 0.30;
            const dropEase = Math.pow(phaseProgress, 1.8);
            translateY = -20 * (1 - dropEase);
            scale = 1.015 - dropEase * 0.015;
          }
        } else {
          // Future card not yet scrolled to: completely hidden!
          translateY = 0;
          scale = 1;
          opacity = 0;
        }
      }

      const newTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        opacity: Math.round(opacity * 100) / 100
      };

      const lastTransform = lastTransformsRef.current.get(i);
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs((lastTransform.scale ?? 1) - newTransform.scale) > 0.001 ||
        Math.abs((lastTransform.opacity ?? 1) - newTransform.opacity) > 0.01;

      if (hasChanged) {
        card.style.transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale})`;
        card.style.opacity = `${newTransform.opacity}`;
        card.style.visibility = newTransform.opacity > 0.01 ? 'visible' : 'hidden';
        lastTransformsRef.current.set(i, newTransform);
      }

      if (i === cardsRef.current.length - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemStackDistance,
    stackPosition,
    useWindowScroll,
    onStackComplete,
    parsePercentage,
    getScrollData,
    getElementOffset
  ]);

  const handleScroll = useCallback(() => {
    updateCardTransforms();
  }, [updateCardTransforms]);

  const setupLenis = useCallback(() => {
    if (useWindowScroll) {
      const lenis = new Lenis({
        duration: 1.5,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.5,
        infinite: false,
        wheelMultiplier: 0.70,
        lerp: 0.075,
        syncTouch: true,
        syncTouchLerp: 0.075
      });

      lenis.on('scroll', handleScroll);

      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);

      lenisRef.current = lenis;
      return lenis;
    } else {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const lenis = new Lenis({
        wrapper: scroller,
        content: scroller.querySelector('.scroll-stack-inner') as HTMLElement,
        duration: 1.5,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.5,
        infinite: false,
        gestureOrientation: 'vertical',
        wheelMultiplier: 0.70,
        lerp: 0.075,
        syncTouch: true,
        syncTouchLerp: 0.075
      });

      lenis.on('scroll', handleScroll);

      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);

      lenisRef.current = lenis;
      return lenis;
    }
  }, [handleScroll, useWindowScroll]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(
      useWindowScroll
        ? document.querySelectorAll('.scroll-stack-card')
        : scroller.querySelectorAll('.scroll-stack-card')
    ) as HTMLElement[];

    cardsRef.current = cards;
    const transformsCache = lastTransformsRef.current;

    cards.forEach((card, i) => {
      if (i < cards.length - 1) {
        card.style.marginBottom = `${itemDistance}px`;
      }
      card.style.zIndex = `${i + 1}`;
      card.style.transition = 'none';
      card.style.opacity = i === 0 ? '1' : '0';
      card.style.visibility = i === 0 ? 'visible' : 'hidden';
      card.style.willChange = 'transform, opacity';
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
      card.style.transform = 'translateZ(0)';
      card.style.webkitTransform = 'translateZ(0)';
      card.style.perspective = '1000px';
      card.style.webkitPerspective = '1000px';
    });

    setupLenis();

    updateCardTransforms();

    const parentSection = (scroller.closest('section') || scroller.parentElement) as HTMLElement | null;

    const handleSectionWheel = (e: WheelEvent) => {
      if (useWindowScroll) return;

      const atTop = scroller.scrollTop <= 2;
      const atBottom = scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 4;

      if (e.deltaY > 0) {
        if (!atBottom) {
          // Traversing forward through cards: forward background scrolls to the stack
          if (!scroller.contains(e.target as Node)) {
            scroller.scrollTop += e.deltaY;
          }
        } else {
          // All cards stacked: effortlessly continue scrolling the rest of the page down
          window.scrollBy({ top: e.deltaY, behavior: 'auto' });
        }
      } else if (e.deltaY < 0) {
        if (!atTop) {
          // Traversing backward through cards: forward background scrolls to the stack
          if (!scroller.contains(e.target as Node)) {
            scroller.scrollTop += e.deltaY;
          }
        } else {
          // Reached the top card: effortlessly continue scrolling the rest of the page up
          window.scrollBy({ top: e.deltaY, behavior: 'auto' });
        }
      }
    };

    if (parentSection) {
      parentSection.addEventListener('wheel', handleSectionWheel, { passive: true });
    }

    return () => {
      if (parentSection) {
        parentSection.removeEventListener('wheel', handleSectionWheel);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      stackCompletedRef.current = false;
      cardsRef.current = [];
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    scaleDuration,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    setupLenis,
    updateCardTransforms
  ]);

  return (
    <div className={`scroll-stack-scroller ${className}`.trim()} ref={scrollerRef}>
      <div className="scroll-stack-inner">
        {children}
        {/* Spacer so the last pin can release cleanly */}
        <div className="scroll-stack-end" />
      </div>
    </div>
  );
};

export default ScrollStack;

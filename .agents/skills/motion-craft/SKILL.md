---
name: motion-craft
description: Fluid spring physics, micro-interactions, Framer Motion choreography, gesture physics, and buttery-smooth layout transitions for React and Tailwind.
---

# Motion Craft — Fluid Spring Physics & Micro-Interactions

Motion Craft is the specialized skill for designing, choreographing, and engineering high-fidelity web animations, tactile micro-interactions, and fluid physics-based transitions.

---

## 1. Core Physics & Transition Taxonomy

### A. Spring Physics (Interactive & Responsive Elements)
Use physics springs for direct user interactions (clicks, hovers, drags, toggles) so the UI feels physical and tactile.

* **Snappy UI Actions (Buttons, Badges, Tabs):**
  ```ts
  transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }
  ```
* **Gentle / Floating Dialogs (Modals, Tooltips, Drawers):**
  ```ts
  transition: { type: 'spring', stiffness: 260, damping: 24, mass: 1 }
  ```
* **Playful / Bouncy Accents (Icons, Reactions, Status Badges):**
  ```ts
  transition: { type: 'spring', stiffness: 350, damping: 15, mass: 0.9 }
  ```

### B. High-Precision Cubic-Bezier Easing (Page Entrances & Reveals)
Use smooth bezier curves for scroll reveals and sequential choreography:

* **Swift Arrival (Hero, Headlines, Cards):**
  ```ts
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
  ```
* **Gentle Decay (Fade Outs, Exits):**
  ```ts
  transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] }
  ```

---

## 2. Layout Transitions & Shared Magic Moves (`layoutId`)

### Shared Layout Pill Indicators
When building tabs, segmented controls, or floating navbars, use `layoutId` to morph the active indicator without jump cuts:

```tsx
{tabs.map((tab) => (
  <button
    key={tab.id}
    onClick={() => setActive(tab.id)}
    className="relative px-4 py-2 text-sm font-semibold"
  >
    {active === tab.id && (
      <motion.div
        layoutId="active-pill"
        className="absolute inset-0 bg-zinc-900 rounded-full z-0"
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />
    )}
    <span className="relative z-10">{tab.label}</span>
  </button>
))}
```

---

## 3. Staggered Orchestration (Cascading Entrances)

Avoid bringing elements into the screen all at once. Use parent-child stagger variants:

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};
```

---

## 4. Micro-Interactions & Tactile Button Physics

### Tactile Press & Hover States
Every button and clickable element should provide instant tactile feedback:

* **Hover**: `whileHover={{ scale: 1.02, y: -1 }}`
* **Active Tap**: `whileTap={{ scale: 0.97 }}`
* **Focus Ring**: `focus-visible:ring-2 focus-visible:ring-primary/40 focus:outline-none`

### Magnetic Icon Tilts
```tsx
<motion.div
  whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
  transition={{ duration: 0.4, ease: 'easeInOut' }}
>
  <Icon size={20} />
</motion.div>
```

---

## 5. Performance & Hardware Acceleration

### Strict Composite-Only Rule
* **ONLY animate composite properties:** `transform` (`x`, `y`, `scale`, `rotate`), `opacity`, and `filter`.
* **NEVER animate layout triggers:** Avoid animating `width`, `height`, `top`, `left`, `margin`, or `padding` directly. Use `layout` or `transform` scales instead.
* **GPU Promotion:** Add `className="transform-gpu will-change-transform"` to all continuous or scroll-triggered motion containers.

---

## 6. Accessibility & Reduced Motion

Always respect user OS preferences for reduced motion:

```tsx
import { useReducedMotion } from 'motion/react';

const shouldReduceMotion = useReducedMotion();
const animation = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
```

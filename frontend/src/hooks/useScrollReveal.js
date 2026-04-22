import { useEffect, useRef } from 'react';

/**
 * useScrollReveal — triggers a CSS class when an element enters the viewport.
 * Uses IntersectionObserver for smooth, performant scroll animations.
 * 
 * @param {string} revealClass - The class to add when visible (default: 'revealed')
 * @param {object} options - IntersectionObserver options
 */
export function useScrollReveal(revealClass = 'revealed', options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(revealClass);
          observer.unobserve(el); // Only trigger once
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [revealClass]);

  return ref;
}

/**
 * useStaggerReveal — triggers staggered reveals on a list of child elements.
 * Pass a CSS selector for the children to stagger.
 */
export function useStaggerReveal(childSelector = '.stagger-child', options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const children = container.querySelectorAll(childSelector);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach((child, i) => {
            setTimeout(() => child.classList.add('revealed'), i * 100);
          });
          observer.unobserve(container);
        }
      },
      { threshold: 0.05, ...options }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [childSelector]);

  return ref;
}

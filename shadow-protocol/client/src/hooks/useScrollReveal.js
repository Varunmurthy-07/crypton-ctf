import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Animates any descendant marked with data-reveal / data-reveal-left /
 * data-reveal-row. Used on every page so the whole site, not just home,
 * responds to ScrollTrigger.
 */
export function useScrollReveal(ref, deps = []) {
  useLayoutEffect(() => {
    if (!ref.current) return undefined

    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 38,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%' }
        })
      })

      gsap.utils.toArray('[data-reveal-left]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          x: -44,
          clipPath: 'inset(0 100% 0 0)',
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%' }
        })
      })

      gsap.utils.toArray('[data-reveal-row]').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          x: -24,
          duration: 0.45,
          delay: (i % 8) * 0.035,
          ease: 'power1.out',
          scrollTrigger: { trigger: el, start: 'top 96%' }
        })
      })
    }, ref)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

'use client'

import { Suspense, lazy, ComponentProps } from 'react'
import { useLazyComponent } from '@/hooks/use-lazy-component'

// Lazy load framer-motion components
const MotionDiv = lazy(() => 
  import('framer-motion').then(mod => ({ default: mod.motion.div }))
)

const MotionSection = lazy(() => 
  import('framer-motion').then(mod => ({ default: mod.motion.section }))
)

const MotionArticle = lazy(() => 
  import('framer-motion').then(mod => ({ default: mod.motion.article }))
)

const MotionSpan = lazy(() => 
  import('framer-motion').then(mod => ({ default: mod.motion.span }))
)

const MotionH1 = lazy(() => 
  import('framer-motion').then(mod => ({ default: mod.motion.h1 }))
)

const MotionH2 = lazy(() => 
  import('framer-motion').then(mod => ({ default: mod.motion.h2 }))
)

const MotionH3 = lazy(() => 
  import('framer-motion').then(mod => ({ default: mod.motion.h3 }))
)

const MotionP = lazy(() => 
  import('framer-motion').then(mod => ({ default: mod.motion.p }))
)

// Fallback component para loading
const MotionFallback = ({ children, className, whileInView: _whileInView, ...props }: any) => (
  <div className={className} {...props}>
    {children}
  </div>
)

// Wrapper components com Suspense
export const AnimatedDiv = (props: ComponentProps<typeof MotionDiv>) => (
  <Suspense fallback={<MotionFallback {...props} />}>
    <MotionDiv {...props} />
  </Suspense>
)

export const AnimatedSection = (props: ComponentProps<typeof MotionSection>) => (
  <Suspense fallback={<MotionFallback {...props} />}>
    <MotionSection {...props} />
  </Suspense>
)

export const AnimatedArticle = (props: ComponentProps<typeof MotionArticle>) => (
  <Suspense fallback={<MotionFallback {...props} />}>
    <MotionArticle {...props} />
  </Suspense>
)

export const AnimatedSpan = (props: ComponentProps<typeof MotionSpan>) => (
  <Suspense fallback={<MotionFallback {...props} />}>
    <MotionSpan {...props} />
  </Suspense>
)

export const AnimatedH1 = (props: ComponentProps<typeof MotionH1>) => (
  <Suspense fallback={<MotionFallback {...props} />}>
    <MotionH1 {...props} />
  </Suspense>
)

export const AnimatedH2 = (props: ComponentProps<typeof MotionH2>) => (
  <Suspense fallback={<MotionFallback {...props} />}>
    <MotionH2 {...props} />
  </Suspense>
)

export const AnimatedH3 = (props: ComponentProps<typeof MotionH3>) => (
  <Suspense fallback={<MotionFallback {...props} />}>
    <MotionH3 {...props} />
  </Suspense>
)

export const AnimatedP = (props: ComponentProps<typeof MotionP>) => (
  <Suspense fallback={<MotionFallback {...props} />}>
    <MotionP {...props} />
  </Suspense>
)

// Hook para carregar framer-motion dinamicamente
export const useFramerMotion = () => {
  return useLazyComponent(() => import('framer-motion'))
}

// Variantes de animação comuns para reutilização
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6 }
}

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6 }
}

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6 }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6 }
}
import React, { useState, useRef, useEffect } from 'react'
import { FileText } from 'lucide-react'

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  fallbackClassName?: string;
  lazy?: boolean;
  showSkeleton?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export function Image({ 
  src, 
  alt, 
  className, 
  fallbackClassName, 
  lazy = true,
  showSkeleton = true,
  retryAttempts = 2,
  retryDelay = 1000,
  ...props 
}: ImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isInView, setIsInView] = useState(!lazy)
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef<HTMLImageElement>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before the image comes into view
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [lazy])

  // Reset states when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src)
      setHasError(false)
      setIsLoading(true)
      setCurrentAttempt(0)
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [src, currentSrc])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  const handleError = () => {
    if (currentAttempt < retryAttempts) {
      // Retry after delay
      setCurrentAttempt(prev => prev + 1)
      retryTimeoutRef.current = setTimeout(() => {
        // Only retry if src is not empty
        if (src && src.trim() !== '') {
          setCurrentSrc(`${src}?retry=${currentAttempt + 1}`)
        } else {
          setHasError(true)
          setIsLoading(false)
        }
      }, retryDelay * (currentAttempt + 1)) // Exponential backoff
    } else {
      setHasError(true)
      setIsLoading(false)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
    setCurrentAttempt(0) // Reset attempt counter on successful load
  }

  // Show fallback if error or no src or empty src
  if (hasError || !src || src === '' || src.trim() === '') {
    return (
      <div
        ref={imgRef}
        className={`inline-flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 ${fallbackClassName || className || ''}`}
        {...props}
      >
        <FileText className="w-8 h-8 opacity-40" />
      </div>
    )
  }

  // Show skeleton while loading (if enabled)
  if (showSkeleton && isLoading && isInView) {
    return (
      <div
        ref={imgRef}
        className={`animate-pulse bg-gray-200 ${className || ''}`}
        {...props}
      />
    )
  }

  // Show placeholder for lazy loading
  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-100 ${className || ''}`}
        {...props}
      />
    )
  }

  return (
    <img
      ref={imgRef}
      src={currentSrc || undefined}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className || ''}`}
      onError={handleError}
      onLoad={handleLoad}
      loading={lazy ? 'lazy' : 'eager'}
      {...props}
    />
  )
}

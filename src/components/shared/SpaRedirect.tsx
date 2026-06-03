'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Handles GitHub Pages 404 → root redirect, then restores the original path.
export default function SpaRedirect() {
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    if (redirect) {
      router.replace(redirect)
    }
  }, [router])

  return null
}

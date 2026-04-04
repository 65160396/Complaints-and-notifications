'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '../lib/api'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.replace('/login')
      return
    }
    // samo / officer / admin → dashboard
    if (['samo', 'officer', 'admin'].includes(user.role)) {
      router.replace('/dashboard')
    } else {
      // student / personnel → complaints
      router.replace('/complaints')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">กำลังโหลด...</p>
      </div>
    </div>
  )
}
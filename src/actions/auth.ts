'use server'

import { supabase } from '@/lib/supabase'
import { signToken, setAuthCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return { success: false, error: 'Invalid credentials' }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid credentials' }
    }

    const token = signToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name || user.email.split('@')[0]
    })

    await setAuthCookie(token)

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function logout() {
  const { removeAuthCookie } = await import('@/lib/auth')
  await removeAuthCookie()
}

export async function getAuthUser() {
  const { cookies } = await import('next/headers')
  const { verifyToken } = await import('@/lib/auth')
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  const decoded = verifyToken(token) as any
  if (!decoded) return null
  return { 
    id: decoded.id, 
    email: decoded.email, 
    role: decoded.role, 
    name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'User') 
  }
}

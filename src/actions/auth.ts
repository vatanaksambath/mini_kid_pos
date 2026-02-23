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
      role: user.role 
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

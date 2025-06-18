import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current remaining seconds without deducting
    const { data: user, error } = await supabase
      .from('users')
      .select('remaining_seconds')
      .eq('id', user_id)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const remainingSeconds = user.remaining_seconds || 0

    return NextResponse.json({
      success: true,
      remaining_seconds: remainingSeconds
    })

  } catch (error) {
    console.error('Error checking credits:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 
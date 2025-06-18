import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { user_id, seconds_used } = await request.json()

    if (!user_id || !seconds_used) {
      return NextResponse.json(
        { success: false, message: 'User ID and seconds used are required' },
        { status: 400 }
      )
    }

    // Get current user credits
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('remaining_seconds')
      .eq('id', user_id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate new remaining seconds
    const newRemainingSeconds = Math.max(0, user.remaining_seconds - seconds_used)

    // Update user credits
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        remaining_seconds: newRemainingSeconds,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select('remaining_seconds')
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      remaining_seconds: updatedUser.remaining_seconds,
      seconds_deducted: seconds_used,
      message: `${seconds_used} seconds deducted successfully`
    })

  } catch (error) {
    console.error('Credits update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update credits' },
      { status: 500 }
    )
  }
} 
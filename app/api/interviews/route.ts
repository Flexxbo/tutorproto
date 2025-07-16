import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const {
      user_id,
      profile_id,
      user_name,
      job_description,
      cv_info,
      action,
      interview_id,
      duration_seconds
    } = await request.json()

    if (action === 'create') {
      // Create new interview
      const { data: interview, error } = await supabase
        .from('interviews')
        .insert({
          user_id,
          profile_id,
          user_name,
          job_description,
          cv_info,
          status: 'idle',
          duration_seconds: 0,
          feedback: null
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        interview
      })
    }

    if (action === 'update') {
      // Get the body data for update
      const updateData = await request.json()
      
      // Update existing interview
      const { data: interview, error } = await supabase
        .from('interviews')
        .update({
          status: updateData.status,
          duration_seconds,
          feedback: updateData.feedback
        })
        .eq('id', interview_id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        interview
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Interview API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: 'User ID required' },
        { status: 400 }
      )
    }

    const { data: interviews, error } = await supabase
      .from('interviews')
      .select('*, profiles(name, job_title)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      interviews
    })

  } catch (error) {
    console.error('Interview fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch interviews' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name')

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      profiles
    })

  } catch (error) {
    console.error('Profiles fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}

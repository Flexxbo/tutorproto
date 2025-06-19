import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getFeedbackStrategy } from '@/lib/feedback-strategies'

export async function POST(request: NextRequest) {
  try {
    const { transcript, job_description, user_name, profile_id } = await request.json()

    if (!transcript || !job_description || !profile_id) {
      return NextResponse.json(
        { success: false, message: 'Transcript, job description, and profile ID are required' },
        { status: 400 }
      )
    }

    // Fetch profile with feedback configuration
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('feedback_type, feedback_config')
      .eq('id', profile_id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get appropriate feedback strategy
    let strategy = getFeedbackStrategy(profile.feedback_type || 'simple')
    let actualStrategyUsed = profile.feedback_type || 'simple'
    
    try {
      // Generate feedback using the strategy
      const feedback = await strategy.generateFeedback(
        transcript,
        job_description,
        user_name,
        profile.feedback_config || {}
      )
      
      // Check if feedback indicates API failure and fallback to simple if needed
      if (feedback.includes('temporarily unavailable due to API limits') && profile.feedback_type !== 'simple') {
        console.log(`[FEEDBACK] Complex strategy failed due to quota, falling back to simple strategy`)
        
        strategy = getFeedbackStrategy('simple')
        actualStrategyUsed = 'simple_fallback'
        
        const fallbackFeedback = await strategy.generateFeedback(
          transcript,
          job_description,
          user_name,
          { prompt_template: `You are an expert interview coach. Provide concise but helpful feedback for this ${profile.feedback_type} interview analysis.` }
        )
        
        return NextResponse.json({
          success: true,
          feedback: fallbackFeedback,
          feedback_type: actualStrategyUsed,
          processing_info: {
            strategy_used: actualStrategyUsed,
            original_strategy: profile.feedback_type,
            fallback_reason: 'API quota exceeded',
            timestamp: new Date().toISOString()
          }
        })
      }

      return NextResponse.json({
        success: true,
        feedback,
        feedback_type: actualStrategyUsed,
        processing_info: {
          strategy_used: actualStrategyUsed,
          timestamp: new Date().toISOString()
        }
      })
      
    } catch (strategyError) {
      console.error('[FEEDBACK] Strategy execution failed completely:', strategyError)
      
      // Final fallback - return a simple manual message
      return NextResponse.json({
        success: true,
        feedback: `**Feedback temporarily unavailable**\n\nWe apologize, but we're unable to generate detailed feedback at this time due to API limitations. Please try again later or contact support if the issue persists.\n\n**General Interview Tips:**\n- Speak clearly and confidently\n- Provide specific examples from your experience\n- Ask thoughtful questions about the role\n- Follow up with a thank-you note`,
        feedback_type: 'manual_fallback',
        processing_info: {
          strategy_used: 'manual_fallback',
          original_strategy: profile.feedback_type,
          fallback_reason: 'Complete API failure',
          timestamp: new Date().toISOString()
        }
      })
    }

  } catch (error) {
    console.error('Profile feedback generation error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate feedback' },
      { status: 500 }
    )
  }
} 
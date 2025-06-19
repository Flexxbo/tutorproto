import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { transcript, job_description, user_name } = await request.json()

    if (!transcript || !job_description) {
      return NextResponse.json(
        { success: false, message: 'Transcript and job description required' },
        { status: 400 }
      )
    }

    const prompt = `
You are an expert interview coach. Please analyze this job interview transcript and provide detailed feedback.

Job Description:
${job_description}

Interview Transcript:
${transcript}

Please provide feedback in the following format:

**Overall Rating:** [Excellent/Very Good/Good/Needs Improvement/Poor]

**Strengths:**
- [Specific positive points]

**Areas for Improvement:**
- [Specific areas to work on]

**Recommendations:**
- [Actionable advice for future interviews]

Keep the feedback constructive, specific, and helpful for ${user_name || 'the candidate'}.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach providing constructive feedback to help candidates improve their interview performance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    const feedback = completion.choices[0]?.message?.content

    if (!feedback) {
      throw new Error('Failed to generate feedback')
    }

    return NextResponse.json({
      success: true,
      feedback
    })

  } catch (error) {
    console.error('Feedback generation error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate feedback' },
      { status: 500 }
    )
  }
} 
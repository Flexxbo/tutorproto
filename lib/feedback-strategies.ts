import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface FeedbackStrategy {
  generateFeedback(
    transcript: string, 
    jobDescription: string, 
    userName: string, 
    config: any
  ): Promise<string>
}

export class SimpleFeedbackStrategy implements FeedbackStrategy {
  async generateFeedback(
    transcript: string, 
    jobDescription: string, 
    userName: string, 
    config: any
  ): Promise<string> {
    const prompt = config.prompt_template || `
You are an expert interview coach. Please analyze this job interview transcript and provide detailed feedback.

Job Description:
${jobDescription}

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

Keep the feedback constructive, specific, and helpful for ${userName || 'the candidate'}.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
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

    return completion.choices[0]?.message?.content || 'Failed to generate feedback'
  }
}

export class MultiAnalysisFeedbackStrategy implements FeedbackStrategy {
  async generateFeedback(
    transcript: string, 
    jobDescription: string, 
    userName: string, 
    config: any
  ): Promise<string> {
    const analyses = config.analyses || []
    const analysisResults: Array<{name: string, result: string, weight: number}> = []

    // Run each analysis
    for (const analysis of analyses) {
      const prompt = `
${analysis.prompt}

Job Description:
${jobDescription}

Interview Transcript:
${transcript}

Provide specific, detailed analysis for ${userName || 'the candidate'}.
`

      console.log(`[FEEDBACK] Starting ${analysis.name} analysis for user: ${userName}`)
      console.log(`[FEEDBACK] Analysis prompt: ${analysis.prompt}`)

      const analysisResult = await safeOpenAICall(
        () => openai.chat.completions.create({
          model: "gpt-4.1-nano",
          messages: [
            {
              role: "system",
              content: `You are an expert evaluating the ${analysis.name} aspect of an interview.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7
        }),
        `Basic ${analysis.name} assessment would be provided here if API was available.`,
        analysis.name
      )
      
      console.log(`[FEEDBACK] ${analysis.name} analysis result:`)
      console.log(analysisResult)
      console.log(`[FEEDBACK] --- End of ${analysis.name} analysis ---`)

      analysisResults.push({
        name: analysis.name,
        result: analysisResult,
        weight: analysis.weight || 1
      })
    }

    // Synthesize all analyses
    console.log(`[FEEDBACK] Starting synthesis for user: ${userName}`)
    console.log(`[FEEDBACK] Number of analyses to synthesize: ${analysisResults.length}`)
    
    const synthesisPrompt = `
${config.synthesis_prompt}

Individual Analyses:
${analysisResults.map(a => `
**${a.name.toUpperCase()} (Weight: ${a.weight}):**
${a.result}
`).join('\n')}

Create a comprehensive, well-structured final feedback for ${userName || 'the candidate'}.
`

    console.log(`[FEEDBACK] Synthesis prompt: ${config.synthesis_prompt}`)

    const finalResult = await safeOpenAICall(
      () => openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach synthesizing multiple detailed analyses into comprehensive feedback."
          },
          {
            role: "user",
            content: synthesisPrompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.7
      }),
      'Combined analysis results would be synthesized here if API was available.',
      'synthesis'
    )
    
    console.log(`[FEEDBACK] Final synthesized feedback:`)
    console.log(finalResult)
    console.log(`[FEEDBACK] === Multi-analysis feedback generation complete ===`)

    return finalResult
  }
}

export class DetailedFeedbackStrategy implements FeedbackStrategy {
  async generateFeedback(
    transcript: string, 
    jobDescription: string, 
    userName: string, 
    config: any
  ): Promise<string> {
    const stages = config.stages || []
    const stageResults: Array<{name: string, result: string}> = []

    // Execute each stage sequentially
    console.log(`[FEEDBACK] Starting detailed analysis with ${stages.length} stages for user: ${userName}`)
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      
      console.log(`[FEEDBACK] Starting stage ${i + 1}/${stages.length}: ${stage.name}`)
      console.log(`[FEEDBACK] Stage prompt: ${stage.prompt}`)
      
      let prompt = `
${stage.prompt}

Job Description:
${jobDescription}

Interview Transcript:
${transcript}
`

      // Include previous stage results for context
      if (stageResults.length > 0) {
        prompt += `\n\nPrevious Analysis Results:\n${stageResults.map(s => `${s.name}: ${s.result}`).join('\n\n')}`
      }

      prompt += `\n\nAnalyze for ${userName || 'the candidate'}.`

      const stageResult = await safeOpenAICall(
        () => openai.chat.completions.create({
          model: "gpt-4.1-nano",
          messages: [
            {
              role: "system",
              content: `You are conducting stage ${i + 1} of ${stages.length} in a detailed interview analysis.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }),
        `Stage ${i + 1} analysis would be provided here if API was available.`,
        `stage_${i + 1}_${stage.name}`
      )
      
      console.log(`[FEEDBACK] Stage ${i + 1} (${stage.name}) result:`)
      console.log(stageResult)
      console.log(`[FEEDBACK] --- End of stage ${i + 1} ---`)

      stageResults.push({
        name: stage.name,
        result: stageResult
      })
    }

    // Return the final stage result, or combine all if no final synthesis stage
    const finalStage = stageResults[stageResults.length - 1]
    
    console.log(`[FEEDBACK] Detailed analysis complete. Final stage: ${finalStage.name}`)
    
    if (finalStage.name.includes('synthesis') || finalStage.name.includes('final')) {
      console.log(`[FEEDBACK] Using final synthesis stage result`)
      console.log(`[FEEDBACK] === Detailed feedback generation complete ===`)
      return finalStage.result
    }

    // If no final synthesis, combine all results
    console.log(`[FEEDBACK] No final synthesis stage found, combining all results`)
    const combinedResult = stageResults.map(s => `**${s.name.toUpperCase()}:**\n${s.result}`).join('\n\n')
    console.log(`[FEEDBACK] === Detailed feedback generation complete ===`)
    return combinedResult
  }
}

// Error handling wrapper for OpenAI API calls
async function safeOpenAICall(
  apiCall: () => Promise<any>, 
  fallbackMessage: string,
  operationName: string
): Promise<string> {
  try {
    const completion = await apiCall()
    return completion.choices[0]?.message?.content || fallbackMessage
  } catch (error: any) {
    console.error(`[FEEDBACK ERROR] ${operationName} failed:`, error.message)
    
    // Handle specific OpenAI errors
    if (error.status === 429) {
      console.log(`[FEEDBACK] Quota exceeded during ${operationName}, returning graceful fallback`)
      return `**Analysis temporarily unavailable due to API limits.**\n\n${fallbackMessage}`
    }
    
    if (error.status === 401) {
      console.log(`[FEEDBACK] Authentication error during ${operationName}`)
      return `**Analysis unavailable due to authentication error.**\n\n${fallbackMessage}`
    }
    
    // Generic error fallback
    return `**Analysis temporarily unavailable.**\n\n${fallbackMessage}`
  }
}

export function getFeedbackStrategy(feedbackType: string): FeedbackStrategy {
  switch (feedbackType) {
    case 'multi_analysis':
      return new MultiAnalysisFeedbackStrategy()
    case 'detailed':
      return new DetailedFeedbackStrategy()
    case 'simple':
    default:
      return new SimpleFeedbackStrategy()
  }
} 
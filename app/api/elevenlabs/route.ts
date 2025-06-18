import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { agent_id, action } = await request.json()
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    if (action === 'get_signed_url') {
      // Resolve environment variable name to actual agent ID
      let actualAgentId = agent_id
      if (agent_id.startsWith('ELEVEN_AGENT_ID_')) {
        actualAgentId = process.env[agent_id]
        if (!actualAgentId) {
          return NextResponse.json(
            { success: false, message: `Environment variable ${agent_id} not configured` },
            { status: 500 }
          )
        }
      }

      // Generate signed URL for ElevenLabs Conversational AI
      const requestHeaders: HeadersInit = new Headers()
      requestHeaders.set("xi-api-key", apiKey)

      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${actualAgentId}`,
        {
          method: "GET",
          headers: requestHeaders,
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`)
      }

      const body = await response.json()
      
      return NextResponse.json({
        success: true,
        signed_url: body.signed_url,
        agent_id: actualAgentId,
        original_agent_ref: agent_id
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action. Use "get_signed_url"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('ElevenLabs API error:', error)
    return NextResponse.json(
      { success: false, message: `Failed to get signed URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 
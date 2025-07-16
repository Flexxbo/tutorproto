export interface User {
  id: string
  username: string
  password_hash: string
  remaining_seconds: number
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  name: string
  job_title: string
  job_description: string
  elevenlabs_agent_id: string
  created_at: string
}

export interface Interview {
  id: string
  user_id: string
  profile_id: string
  user_name: string
  job_description: string
  cv_info: string
  status: 'idle' | 'connected' | 'running' | 'paused' | 'ended'
  duration_seconds: number
  feedback: string | null
  created_at: string
  updated_at: string
}

export interface TranscriptEntry {
  id: string
  interview_id: string
  speaker: string
  text: string
  timestamp: string
  created_at: string
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useConversation } from "@elevenlabs/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Play, Pause, Square, Clock, Wifi, WifiOff, LogOut, User } from "lucide-react"

type SessionStatus = "idle" | "connected" | "running" | "paused" | "ended"

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle")
  const [sessionTime, setSessionTime] = useState(0)
  const [remainingMinutes, setRemainingMinutes] = useState(0)
  const [selectedProfile, setSelectedProfile] = useState("")
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string; job_title: string; job_description: string; elevenlabs_agent_id: string }>>([])
  const [userName, setUserName] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [cvInfo, setCvInfo] = useState("")
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; time: string }>>([])
  const [feedback, setFeedback] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [conversationUrl, setConversationUrl] = useState<string | null>(null)
  const [pausedSessionData, setPausedSessionData] = useState<{
    selectedProfile: string;
    signedUrl: string;
    overrides: any;
  } | null>(null)

  const router = useRouter()

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs')
      setSessionStatus("running")
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs')
      setSessionStatus("ended")
    },
    onMessage: (message) => {
      console.log('Message received:', message)
      
      // Add message to transcript
      const timestamp = new Date().toLocaleTimeString()
      setTranscript(prev => [...prev, {
        speaker: message.source === 'user' ? 'You' : 'AI Trainer',
        text: message.message || '',
        time: timestamp
      }])
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error)
      setSessionStatus("ended")
    }
  })

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn")
    if (!loggedIn) {
      router.push("/login")
    } else {
      setIsLoggedIn(true)
      
      // Load user data from localStorage
      const userData = localStorage.getItem("interview_app_user")
      if (userData) {
        try {
          const user = JSON.parse(userData)
          setRemainingMinutes(Math.floor(user.remaining_seconds / 60))
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
      
      // Load profiles from API
      loadProfiles()
    }
  }, [router])

  const loadProfiles = async () => {
    try {
      const response = await fetch('/api/profiles')
      const data = await response.json()
      if (data.success) {
        setProfiles(data.profiles)
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
    }
  }

  const handleProfileChange = (profileId: string) => {
    setSelectedProfile(profileId)
    
    // Auto-populate job description based on selected profile
    const selectedProfileData = profiles.find(p => p.id === profileId)
    if (selectedProfileData) {
      setJobDescription(selectedProfileData.job_description)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (sessionStatus === "running") {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [sessionStatus])



  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    router.push("/login")
  }

  const handleStartSession = async () => {
    if (sessionStatus === "idle") {
      // Check if profile is selected
      if (!selectedProfile) {
        alert('Please select a profile first')
        return
      }

      // Get the agent ID for the selected profile
      const selectedProfileData = profiles.find(p => p.id === selectedProfile)
      if (!selectedProfileData) {
        alert('Invalid profile selected')
        return
      }

      try {
        setSessionStatus("connected")
        setShowFeedback(false)
        setTranscript([]) // Clear previous transcript

        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true })

        // Get signed URL from our API
        const response = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent_id: selectedProfileData.elevenlabs_agent_id,
            action: 'get_signed_url'
          })
        })

        const data = await response.json()
        if (!data.success) {
          throw new Error(data.message)
        }

        // Start ElevenLabs conversation
        setConversationUrl(data.signed_url)
        await conversation.startSession({ 
          signedUrl: data.signed_url
        })

        // Store session data for potential pause/resume
        setPausedSessionData({
          selectedProfile: selectedProfile,
          signedUrl: data.signed_url,
          overrides: {}
        })


        
      } catch (error) {
        console.error('Failed to start session:', error)
        alert(`Failed to start interview: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setSessionStatus("idle")
      }
    } else if (sessionStatus === "paused") {
      // Resume conversation using stored session data
      if (pausedSessionData) {
        try {
          setSessionStatus("connected")
          
          await conversation.startSession({ 
            signedUrl: pausedSessionData.signedUrl
          })
        } catch (error) {
          console.error('Failed to resume session:', error)
          alert(`Failed to resume interview: ${error instanceof Error ? error.message : 'Unknown error'}`)
          setSessionStatus("paused")
        }
      }
    }
  }

  const handlePauseSession = async () => {
    try {
      // End the current conversation to actually pause
      await conversation.endSession()
      setSessionStatus("paused")
    } catch (error) {
      console.error('Failed to pause session:', error)
    }
  }

  const handleEndSession = async () => {
    try {
      // End ElevenLabs conversation
      await conversation.endSession()
      
      setSessionStatus("ended")
      setShowFeedback(true)
      
      // Clear paused session data since interview is ending
      setPausedSessionData(null)

      // Deduct credits based on interview duration
      await deductCredits()

      // Generate real feedback using transcript
      generateFeedback()
      
    } catch (error) {
      console.error('Error ending session:', error)
      setSessionStatus("ended")
    }
  }

  const deductCredits = async () => {
    try {
      // Get user data from localStorage
      const userData = localStorage.getItem("interview_app_user")
      if (!userData) return

      const user = JSON.parse(userData)
      
      // Deduct credits based on session duration
      const response = await fetch('/api/users/update-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          seconds_used: sessionTime
        })
      })

      const data = await response.json()
      if (data.success) {
        // Update remaining minutes in UI
        setRemainingMinutes(Math.floor(data.remaining_seconds / 60))
        
        // Update user data in localStorage
        const updatedUser = { ...user, remaining_seconds: data.remaining_seconds }
        localStorage.setItem("interview_app_user", JSON.stringify(updatedUser))
        
        console.log(`Credits deducted: ${data.seconds_deducted} seconds`)
      } else {
        console.error('Failed to deduct credits:', data.message)
      }
    } catch (error) {
      console.error('Error deducting credits:', error)
    }
  }

  const generateFeedback = async () => {
    try {
      // Convert transcript to text
      const transcriptText = transcript.map(entry => 
        `${entry.speaker}: ${entry.text}`
      ).join('\n')

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText,
          job_description: jobDescription,
          user_name: userName
        })
      })

      const data = await response.json()
      if (data.success) {
        setFeedback(data.feedback)
      } else {
        setFeedback('Failed to generate feedback. Please try again.')
      }
    } catch (error) {
      console.error('Error generating feedback:', error)
      setFeedback('Failed to generate feedback. Please try again.')
    }
  }

  const handleNewInterview = () => {
    setSessionStatus("idle")
    setSessionTime(0)
    setTranscript([])
    setFeedback("")
    setShowFeedback(false)
    setPausedSessionData(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusText = () => {
    if (conversation.status === "connected" && conversation.isSpeaking) {
      return "AI Speaking..."
    }
    if (conversation.status === "connected" && !conversation.isSpeaking) {
      return "Listening..."
    }
    
    switch (sessionStatus) {
      case "idle":
        return "Ready to Start"
      case "connected":
        return "Connecting..."
      case "running":
        return "Interview Running"
      case "paused":
        return "Interview Paused"
      case "ended":
        return "Interview Ended"
      default:
        return "Unknown"
    }
  }

  const getStatusColor = () => {
    switch (sessionStatus) {
      case "idle":
        return "secondary"
      case "connected":
        return "default"
      case "running":
        return "default"
      case "paused":
        return "secondary"
      case "ended":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (!isLoggedIn) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Trainer – Prototype</h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              <Clock className="w-4 h-4 mr-1" />
              Remaining Minutes: {remainingMinutes}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Welcome!</CardTitle>
              <CardDescription>
                Here's how it works: Choose a profile, enter your information, and start the interview. The AI trainer
                will guide you through a realistic job interview.
              </CardDescription>
            </CardHeader>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Trainer Avatar */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src="/placeholder.svg?height=96&width=96" />
                      <AvatarFallback className="text-2xl">
                        <User className="w-12 h-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">AI Interview Trainer</h3>
                      <p className="text-muted-foreground">Your personal conversation partner</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status and Controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {conversation.status === "connected" ? (
                          <Wifi className="w-5 h-5 text-green-500" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-gray-400" />
                        )}
                        <Badge variant={getStatusColor() as any}>{getStatusText()}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {formatTime(sessionTime)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {sessionStatus === "idle" && (
                        <Button onClick={handleStartSession} className="flex-1">
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                      )}
                      {sessionStatus === "running" && (
                        <>
                          <Button
                            onClick={handlePauseSession}
                            variant="outline"
                            className="flex-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </Button>
                          <Button onClick={handleEndSession} variant="destructive" className="flex-1">
                            <Square className="w-4 h-4 mr-2" />
                            End
                          </Button>
                        </>
                      )}
                      {sessionStatus === "paused" && (
                        <>
                          <Button onClick={handleStartSession} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </Button>
                          <Button onClick={handleEndSession} variant="destructive" className="flex-1">
                            <Square className="w-4 h-4 mr-2" />
                            End
                          </Button>
                        </>
                      )}
                      {sessionStatus === "ended" && (
                        <Button onClick={handleNewInterview} className="flex-1">
                          New Interview
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile and Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Interview Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile">Profile Selection</Label>
                    <Select value={selectedProfile} onValueChange={handleProfileChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job">Job Description</Label>
                    <Textarea
                      id="job"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Copy or write the job posting here (max. 500 words)..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">{jobDescription.length}/500 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cv">Resume / Additional Info</Label>
                    <Textarea
                      id="cv"
                      value={cvInfo}
                      onChange={(e) => setCvInfo(e.target.value)}
                      placeholder="Relevant information from your resume or other important details..."
                      rows={4}
                    />
                  </div>

                  {/* Feedback Box */}
                  <div className="space-y-2">
                    <Label>Feedback</Label>
                    <Card className="p-4 bg-gray-50 dark:bg-gray-800">
                      {!showFeedback ? (
                        <p className="text-sm text-muted-foreground">
                          Feedback will be generated after the interview ends and will be displayed here after some
                          time.
                        </p>
                      ) : !feedback ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
                          <p className="text-sm text-muted-foreground">Generating feedback...</p>
                        </div>
                      ) : (
                        <div className="prose dark:prose-invert max-w-none text-sm">
                          {feedback.split("\n").map((line, index) => (
                            <p key={index} className="mb-2">
                              {line.startsWith("**") && line.endsWith("**") ? (
                                <strong>{line.slice(2, -2)}</strong>
                              ) : (
                                line
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Transcript */}
            <div className="space-y-6">
              <Card className="h-96">
                <CardHeader>
                  <CardTitle>Live Transcript</CardTitle>
                  <CardDescription>Here you can see in real-time what is being said</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 overflow-y-auto space-y-3">
                    {transcript.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        The transcript will appear here once the interview starts...
                      </p>
                    ) : (
                      transcript.map((entry, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{entry.speaker}</span>
                            <span>{entry.time}</span>
                          </div>
                          <p className="text-sm">{entry.text}</p>
                          {index < transcript.length - 1 && <Separator className="my-2" />}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>This is a prototype. All conversations are recorded for training purposes.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

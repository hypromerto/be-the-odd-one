'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createRoom, joinRoom } from '@/app/actions'
import { signInAnonymously, getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function GameHome() {
  const [joinRoomId, setJoinRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const initializeUser = async () => {
      let user = await getCurrentUser()
      if (!user) {
        user = await signInAnonymously()
      }
      setCurrentUser(user)
    }

    initializeUser()
  }, [])

  const handleCreateRoom = async () => {
    if (!playerName) {
      setError('Please enter your name')
      return
    }
    setIsCreating(true)
    setError(null)
    try {
      const { roomId } = await createRoom(playerName)
      router.push(`/room/${roomId}`)
    } catch (error) {
      console.error('Failed to create room:', error)
      setError('Failed to create room. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinRoomId || !playerName) {
      setError('Please enter both room ID and your name')
      return
    }
    setIsJoining(true)
    setError(null)
    try {
      await joinRoom(joinRoomId, playerName)
      router.push(`/room/${joinRoomId}`)
    } catch (error) {
      console.error('Failed to join room:', error)
      setError('Failed to join room. Please check the room ID and try again.')
    } finally {
      setIsJoining(false)
    }
  }

  if (!currentUser) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
      <Card className="w-full bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-indigo-800">Welcome to Word Wizards!</CardTitle>
          <CardDescription className="text-base sm:text-lg text-indigo-600">Create a new game or join an existing one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-100 rounded-lg p-4 text-indigo-800 text-sm sm:text-base">
            <h3 className="font-bold mb-2">How to Play:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create or join a game room</li>
              <li>Each player submits multiple themes</li>
              <li>Players take turns answering themes</li>
              <li>Earn points for unique answers</li>
              <li>The game continues until all themes are played</li>
            </ol>
          </div>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="create" className="text-sm sm:text-base">Create Game</TabsTrigger>
              <TabsTrigger value="join" className="text-sm sm:text-base">Join Game</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-4">
              <Input
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full text-base"
              />
              <Button onClick={handleCreateRoom} disabled={isCreating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-base sm:text-lg">
                {isCreating ? 'Creating...' : 'Create Room'}
              </Button>
            </TabsContent>
            <TabsContent value="join" className="space-y-4">
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <Input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full text-base"
                />
                <Input
                    type="text"
                    placeholder="Enter Room ID"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    className="w-full text-base"
                />
                <Button type="submit" disabled={isJoining} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-base sm:text-lg">
                  {isJoining ? 'Joining...' : 'Join Room'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
        </CardContent>
      </Card>
  )
}


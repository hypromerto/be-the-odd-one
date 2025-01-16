'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createRoom, joinRoom } from './actions'

export default function HomePage() {
    const [playerName, setPlayerName] = useState('')
    const [roomId, setRoomId] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleCreateRoom = async () => {
        if (!playerName) {
            setError('Please enter your name')
            return
        }
        setError('')
        try {
            const { roomId } = await createRoom(playerName)
            router.push(`/room/${roomId}`)
        } catch (error) {
            console.error('Failed to create room:', error)
            setError('Failed to create room. Please try again.')
        }
    }

    const handleJoinRoom = async () => {
        if (!playerName || !roomId) {
            setError('Please enter your name and room ID')
            return
        }
        setError('')
        try {
            await joinRoom(roomId, playerName)
            router.push(`/room/${roomId}`)
        } catch (error) {
            console.error('Failed to join room:', error)
            setError('Failed to join room. Please check the room ID and try again.')
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="w-full backdrop-blur-sm bg-white/90 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center text-indigo-800">Be the Odd One</CardTitle>
                        <CardDescription className="text-center text-indigo-600">Stand out with your unique answers!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Welcome to Be the Odd One, a game that challenges you to think differently and stand out from the crowd! Here's how to play:
                                </p>
                                <div className="bg-amber-100 p-4 rounded-lg">
                                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                                        <li>Players take turns submitting themes.</li>
                                        <li>Everyone races to come up with unique answers for each theme.</li>
                                        <li>Earn points by being the odd one out - duplicate answers don't count!</li>
                                        <li>Enjoy the creative and sometimes hilarious responses.</li>
                                        <li>In two-player mode, work together to be consistently unique.</li>
                                    </ol>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Whether you're competing to stand out or collaborating to be uniquely in sync, Be the Odd One offers a thrilling word adventure!
                                </p>
                            </div>

                            <Tabs defaultValue="create" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="create">Create Room</TabsTrigger>
                                    <TabsTrigger value="join">Join Room</TabsTrigger>
                                </TabsList>
                                <TabsContent value="create">
                                    <div className="space-y-4">
                                        <Input
                                            type="text"
                                            placeholder="Enter your name"
                                            value={playerName}
                                            onChange={(e) => setPlayerName(e.target.value)}
                                        />
                                        <Button onClick={handleCreateRoom} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                            Create Room
                                        </Button>
                                    </div>
                                </TabsContent>
                                <TabsContent value="join">
                                    <div className="space-y-4">
                                        <Input
                                            type="text"
                                            placeholder="Enter your name"
                                            value={playerName}
                                            onChange={(e) => setPlayerName(e.target.value)}
                                        />
                                        <Input
                                            type="text"
                                            placeholder="Enter room ID"
                                            value={roomId}
                                            onChange={(e) => setRoomId(e.target.value)}
                                        />
                                        <Button onClick={handleJoinRoom} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                            Join Room
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}


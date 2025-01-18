import {redirect} from 'next/navigation'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {createRoom, joinRoom} from './actions'
import AnimatedContent from '@/components/animated-content'
import {isRedirectError} from "next/dist/client/components/redirect"

export default async function HomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <AnimatedContent>
                <Card className="w-full backdrop-blur-sm bg-white/90 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center text-indigo-800">Be the Odd One</CardTitle>
                        <CardDescription className="text-center text-indigo-600">Stand out with your unique
                            answers!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Welcome to Be the Odd One, a game that challenges you to think differently and stand
                                    out from the crowd! Here's how to play:
                                </p>
                                <div className="bg-amber-100 p-4 rounded-lg">
                                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                                        <li>Players take turns submitting themes.</li>
                                        <li>Everyone races to come up with unique answers for each theme.</li>
                                        <li>Earn points by being the odd one out!</li>
                                        <li>At least 3 players are required to start a game.</li>
                                    </ol>
                                </div>
                            </div>

                            <Tabs defaultValue="create" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="create">Create Room</TabsTrigger>
                                    <TabsTrigger value="join">Join Room</TabsTrigger>
                                </TabsList>
                                <TabsContent value="create">
                                    <form action={createRoomAction} className="space-y-4">
                                        <Input
                                            type="text"
                                            name="playerName"
                                            placeholder="Enter your name"
                                            required
                                        />
                                        <Button type="submit"
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                            Create Room
                                        </Button>
                                    </form>
                                </TabsContent>
                                <TabsContent value="join">
                                    <form action={joinRoomAction} className="space-y-4">
                                        <Input
                                            type="text"
                                            name="playerName"
                                            placeholder="Enter your name"
                                            required
                                        />
                                        <Input
                                            type="text"
                                            name="roomId"
                                            placeholder="Enter room ID"
                                            required
                                        />
                                        <Button type="submit"
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                            Join Room
                                        </Button>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>
            </AnimatedContent>
        </div>
    )
}

async function createRoomAction(formData: FormData) {
    'use server'
    const playerName = formData.get('playerName') as string
    if (!playerName) {
        return {error: 'Please enter your name'}
    }
    try {
        const {roomId} = await createRoom(playerName)
        redirect(`/room/${roomId}`)
    } catch (error) {
        rethrowIfRedirectError(error)
        console.error('Failed to create room:', error)
        return {error: 'Failed to create room. Please try again.'}
    }
}

async function joinRoomAction(formData: FormData) {
    'use server'
    const playerName = formData.get('playerName') as string
    const roomId = formData.get('roomId') as string
    if (!playerName || !roomId) {
        return {error: 'Please enter your name and room ID'}
    }
    try {
        await joinRoom(roomId, playerName)
        redirect(`/room/${roomId}`)
    } catch (error) {
        rethrowIfRedirectError(error)
        console.error('Failed to join room:', error)
        return {error: 'Failed to join room. Please check the room ID and try again.'}
    }
}

function rethrowIfRedirectError(error: unknown) {
    if (isRedirectError(error)) {
        throw error
    }
}


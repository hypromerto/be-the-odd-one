'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PlayerCard } from '@/components/player-card'
import { Button } from "@/components/ui/button"
import { startGame } from '@/app/actions'
import ThemeInput from '@/components/theme-input'
import AnswerInput from '@/components/answer-input'
import AnswerReviewScreen from '@/components/answer-review-screen'
import GameResults from '@/components/game-results'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RoomState } from '@/lib/types'
import { Copy, Check } from 'lucide-react'

interface RoomContentProps {
    initialRoomState: RoomState
    roomId: string
    currentUserId: string
}

export default function RoomContent({ initialRoomState, roomId, currentUserId }: RoomContentProps) {
    const [roomState, setRoomState] = useState<RoomState>(initialRoomState)
    const [isCopied, setIsCopied] = useState(false)
    const [isStartingGame, setIsStartingGame] = useState(false) // Update 1: Added isStartingGame state
    const supabase = createClientComponentClient()

    useEffect(() => {
        const channel = supabase.channel(roomId)

        const subscription = channel
            .on('broadcast', { event: 'player_joined' }, payload => {
                setRoomState(prevState => {
                    const updatedPlayers = [...prevState.players]
                    if (!updatedPlayers.some(player => player.id === payload.payload.player_id)) {
                        updatedPlayers.push({
                            id: payload.payload.player_id,
                            name: payload.payload.player_name,
                            avatar: payload.payload.avatar,
                            isHost: false,
                            ready: false
                        })
                    }
                    return { ...prevState, players: updatedPlayers }
                })
            })
            .on('broadcast', { event: 'game_started' }, () => {
                fetchRoomData()
            })
            .on('broadcast', { event: 'all_players_ready' }, () => {
                fetchRoomData()
            })
            .on('broadcast', { event: 'answer_submitted' }, () => {
                fetchRoomData()
            })
            .on('broadcast', { event: 'all_answers_submitted' }, () => {
                fetchRoomData()
            })
            .on('broadcast', { event: 'review_finished' }, () => {
                fetchRoomData()
            })
            .on('broadcast', { event: 'game_over' }, () => {
                fetchRoomData()
            })
            .on('broadcast', { event: 'game_reset' }, () => {
                fetchRoomData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, supabase])

    const fetchRoomData = async () => {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('roomId', roomId)
            .single()

        if (error) {
            console.error('Error fetching room data:', error)
        } else if (data) {
            setRoomState(data)
        }
    }

    const handleStartGame = async () => { // Update 2: Updated handleStartGame function
        if (isStartingGame) return
        setIsStartingGame(true)
        try {
            await startGame(roomId)
        } catch (error) {
            console.error('Failed to start game:', error)
        } finally {
            setIsStartingGame(false)
        }
    }

    const copyGameLink = () => {
        const gameLink = `${window.location.origin}/room/${roomId}`
        navigator.clipboard.writeText(gameLink).then(() => {
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        }, (err) => {
            console.error('Failed to copy: ', err)
        })
    }

    const isHost = roomState.players.some(player => player.id === currentUserId && player.isHost)
    const currentTheme = roomState.themes[roomState.currentRound]
    const hasAnswered = currentTheme?.answers.some(answer => answer.playerId === currentUserId)

    return (
        <Card className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg w-full mx-auto">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-indigo-800">Be the Odd One</CardTitle>
                {roomState.gameState === 'waiting' && (
                    <div className="flex flex-col items-center space-y-2">
                        <CardDescription className="text-lg sm:text-xl text-center bg-amber-200 py-2 px-4 rounded-full inline-block">
                            Room ID: <span className="font-bold text-indigo-700">{roomId}</span>
                        </CardDescription>
                        <Button
                            onClick={copyGameLink}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-full inline-flex items-center transition-colors duration-300"
                        >
                            {isCopied ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Game Link
                                </>
                            )}
                        </Button>
                        <p className="text-sm text-gray-600 mt-2">
                            Share this link with others to invite them to the game!
                        </p>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    {roomState.gameState === 'waiting' ? (
                        <div className="space-y-4">
                            <h2 className="text-xl sm:text-2xl text-indigo-800">Players:</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {roomState.players.map((player, index) => (
                                    <PlayerCard key={index} name={player.name} avatar={player.avatar} isHost={player.isHost} ready={player.ready} />
                                ))}
                            </div>
                            {roomState.players.length < 3 && (
                                <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
                                    <p className="text-yellow-800 text-sm sm:text-base">
                                        At least 3 players are required to start the game. Invite more players to join!
                                    </p>
                                </div>
                            )}
                            {isHost && roomState.players.length >= 3 && (
                                <Button
                                    onClick={handleStartGame}
                                    disabled={isStartingGame} // Update 3: Added disabled prop to button
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200"
                                >
                                    {isStartingGame ? 'Starting Game...' : 'Start Game'}
                                </Button>
                            )}
                            {isHost && roomState.players.length < 3 && (
                                <Button disabled className="w-full bg-gray-400 text-white font-bold py-2 px-4 rounded-full text-lg cursor-not-allowed">
                                    Need at least 3 players to start
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div>
                            {roomState.gameState === 'theme_input' && (
                                <ThemeInput roomId={roomId} />
                            )}
                            {roomState.gameState === 'answer_input' && currentTheme && !hasAnswered && (
                                <AnswerInput
                                    roomId={roomId}
                                    theme={currentTheme.question}
                                />
                            )}
                            {roomState.gameState === 'answer_input' && currentTheme && hasAnswered && (
                                <Card className="w-full">
                                    <CardContent className="flex flex-col items-center space-y-4 p-6">
                                        <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">Waiting for other players</CardTitle>
                                        <CardDescription className="text-center">
                                            You've submitted your answer. Please wait for other players to submit their answers.
                                        </CardDescription>
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                                    </CardContent>
                                </Card>
                            )}
                            {roomState.gameState === 'review' && currentTheme && (
                                <AnswerReviewScreen
                                    roomId={roomId}
                                    theme={currentTheme}
                                    isHost={isHost}
                                />
                            )}
                            {roomState.gameState === 'game_over' && (
                                <GameResults
                                    players={roomState.players}
                                    themes={roomState.themes}
                                    roomId={roomId}
                                    isHost={isHost}
                                />
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}


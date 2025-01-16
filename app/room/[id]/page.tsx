'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayerCard } from '@/components/player-card'
import { Button } from "@/components/ui/button"
import { startGame, joinRoom } from '@/app/actions'
import ThemeInput from '@/components/theme-input'
import AnswerInput from '@/components/answer-input'
import AnswerReviewScreen from '@/components/answer-review-screen'
import GameResults from '@/components/game-results'
import { signInAnonymously, getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RoomState } from '@/lib/types'
import { Copy, Check } from 'lucide-react'

export default function RoomPage() {
  const { id } = useParams()
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [joiningName, setJoiningName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const supabase = createClientComponentClient()

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

  useEffect(() => {
    if (!currentUser) return

    const fetchRoomData = async () => {
      const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('roomId', id)
          .single()

      if (error) {
        console.error('Error fetching room data:', error)
      } else {
        setRoomState(data)
      }
    }

    fetchRoomData()

    const channel = supabase.channel(id as string)

    const subscription = channel
        .on('broadcast', { event: 'player_joined' }, payload => {
          setRoomState(prevState => {
            if (!prevState) return null
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
        .on('broadcast', { event: 'game_started' }, payload => {
          setRoomState(prevState => {
            if (!prevState) return null
            return {
              ...prevState,
              gameState: 'theme_input',
              isTwoPlayerMode: payload.payload.isTwoPlayerMode,
              cooperativeScore: payload.payload.isTwoPlayerMode ? 0 : undefined
            }
          })
        })
        .on('broadcast', { event: 'themes_submitted' }, fetchRoomData)
        .on('broadcast', { event: 'all_players_ready' }, () => {
          setRoomState(prevState => {
            if (!prevState) return null
            return { ...prevState, gameState: 'answer_input' }
          })
          fetchRoomData()
        })
        .on('broadcast', { event: 'answer_submitted' }, payload => {
          setRoomState(prevState => {
            if (!prevState) return null
            return {
              ...prevState,
              cooperativeScore: payload.payload.isTwoPlayerMode ? payload.payload.cooperativeScore : prevState.cooperativeScore
            }
          })
          fetchRoomData()
        })
        .on('broadcast', { event: 'all_answers_submitted' }, () => {
          setRoomState(prevState => {
            if (!prevState) return null
            return { ...prevState, gameState: 'review' }
          })
          fetchRoomData()
        })
        .on('broadcast', { event: 'review_finished' }, payload => {
          setRoomState(prevState => {
            if (!prevState) return null
            return {
              ...prevState,
              gameState: payload.payload.nextGameState,
              currentRound: payload.payload.nextRound
            }
          })
          fetchRoomData()
        })
        .on('broadcast', { event: 'game_over' }, payload => {
          setRoomState(prevState => {
            if (!prevState) return null
            return {
              ...prevState,
              gameState: 'game_over',
              players: payload.payload.players,
              isTwoPlayerMode: payload.payload.isTwoPlayerMode,
              cooperativeScore: payload.payload.cooperativeScore
            }
          })
        })
        .on('broadcast', { event: 'game_reset' }, () => {
          setRoomState(prevState => {
            if (!prevState) return null
            return {
              ...prevState,
              gameState: 'waiting',
              currentRound: 0,
              themes: [],
              isTwoPlayerMode: false,
              cooperativeScore: 0
            }
          })
          fetchRoomData()
        })
        .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase, currentUser])

  const handleStartGame = async () => {
    try {
      await startGame(id as string)
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }

  const handleJoinGame = async () => {
    if (!joiningName) {
      setError('Please enter your name')
      return
    }
    setIsJoining(true)
    setError(null)
    try {
      await joinRoom(id as string, joiningName)
      setRoomState(prevState => {
        if (!prevState) return null
        const updatedPlayers = [...prevState.players]
        if (!updatedPlayers.some(player => player.id === currentUser.id)) {
          updatedPlayers.push({
            id: currentUser.id,
            name: joiningName,
            avatar: 'default',
            isHost: false,
            ready: false
          })
        }
        return { ...prevState, players: updatedPlayers }
      })
    } catch (error) {
      console.error('Failed to join game:', error)
      setError('Failed to join game. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const copyGameLink = () => {
    const gameLink = `${window.location.origin}/room/${id}`
    navigator.clipboard.writeText(gameLink).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }, (err) => {
      console.error('Failed to copy: ', err)
    })
  }

  if (!currentUser || !roomState) {
    return <div>Loading...</div>
  }

  const isHost = roomState.players.some(player => player.id === currentUser.id && player.isHost)

  return (
      <Card className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg w-full mx-auto">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-indigo-800">Be the Odd One</CardTitle>
          {roomState.gameState === 'waiting' && (
              <div className="flex flex-col items-center space-y-2">
                <CardDescription className="text-lg sm:text-xl text-center bg-amber-200 py-2 px-4 rounded-full inline-block">
                  Room ID: <span className="font-bold text-indigo-700">{id}</span>
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
          {roomState.isTwoPlayerMode && roomState.gameState !== 'waiting' && (
              <CardDescription className="text-lg sm:text-xl text-center bg-green-200 py-2 px-4 rounded-full inline-block mx-auto">
                Cooperative Mode: <span className="font-bold text-green-700">Score {roomState.cooperativeScore}</span>
              </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {!roomState.players.some(player => player.id === currentUser.id) ? (
                <motion.div
                    key="join"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                >
                  <h2 className="text-xl sm:text-2xl text-indigo-800">Join the Game</h2>
                  <Input
                      type="text"
                      placeholder="Enter your name"
                      value={joiningName}
                      onChange={(e) => setJoiningName(e.target.value)}
                  />
                  <Button onClick={handleJoinGame} disabled={isJoining} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isJoining ? 'Joining...' : 'Join Game'}
                  </Button>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </motion.div>
            ) : roomState.gameState === 'waiting' ? (
                <motion.div
                    key="waiting"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                >
                  <h2 className="text-xl sm:text-2xl text-indigo-800">Players:</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roomState.players.map((player, index) => (
                        <PlayerCard key={index} name={player.name} avatar={player.avatar} isHost={player.isHost} ready={player.ready} />
                    ))}
                  </div>
                  {roomState.players.length === 2 && (
                      <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 p-4 bg-blue-100 rounded-lg"
                      >
                        <p className="text-blue-800 text-sm sm:text-base">
                          With 2 players, the game will start in cooperative mode. Work together to give unique answers and earn points as a team!
                        </p>
                      </motion.div>
                  )}
                  {isHost && (
                      <Button onClick={handleStartGame} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200">
                        Start Game
                      </Button>
                  )}
                </motion.div>
            ) : (
                <motion.div
                    key={roomState.gameState}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                  {roomState.gameState === 'theme_input' && (
                      <ThemeInput roomId={id as string} />
                  )}
                  {roomState.gameState === 'answer_input' && roomState.themes[roomState.currentRound] && (
                      <AnswerInput
                          roomId={id as string}
                          theme={roomState.themes[roomState.currentRound].question}
                          isTwoPlayerMode={roomState.isTwoPlayerMode}
                      />
                  )}
                  {roomState.gameState === 'review' && roomState.themes[roomState.currentRound] && (
                      <AnswerReviewScreen
                          roomId={id as string}
                          theme={roomState.themes[roomState.currentRound]}
                          isHost={isHost}
                          isTwoPlayerMode={roomState.isTwoPlayerMode}
                      />
                  )}
                  {roomState.gameState === 'game_over' && (
                      <GameResults
                          players={roomState.players}
                          themes={roomState.themes}
                          roomId={id as string}
                          isHost={isHost}
                          isTwoPlayerMode={roomState.isTwoPlayerMode}
                          cooperativeScore={roomState.cooperativeScore}
                      />
                  )}
                </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
  )
}


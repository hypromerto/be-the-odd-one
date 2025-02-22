import exp from "constants"

export interface Player {
    id: number
    user_id: string
    room_id: string
    name: string
    avatar: string
    is_host: boolean
    answer_ready: boolean
    score: number
}

export interface Answer {
    id: number
    theme_id: number
    player_id: string
    player_name: string
    answer: string
    invalid: boolean
    created_at: number
    invalidation_votes: number[]
}

export interface Theme {
    id: number
    room_id: string
    question: string
    author_id: number
    author: Author
    answers: Answer[]
}

export interface RoomState {
    id: number
    room_id: string
    game_state: "waiting" | "theme_input" | "answer_input" | "review" | "game_over"
    current_round: number
    players: Player[]
    themes: Theme[]
    currentUserId: string | null
}

export interface Author {
    name: string
}

export interface PlayerScore {
    id: number
    name: string
    avatar: string
    score: number
}


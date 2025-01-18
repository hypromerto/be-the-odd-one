export interface Player {
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
    ready: boolean;
    score?: number;
}

export interface Theme {
    question: string;
    author: string;
    answers: Array<{
        playerId: string;
        playerName: string;
        answer: string;
        invalid: boolean;
    }>;
}

export interface RoomState {
    roomId: string;
    players: Player[];
    gameState: 'waiting' | 'theme_input' | 'answer_input' | 'review' | 'game_over';
    currentRound: number;
    themes: Theme[];
    version: number;
}


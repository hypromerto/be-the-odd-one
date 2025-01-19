import Image from 'next/image'

interface PlayerCardProps {
    name: string
    avatar: string
    isHost: boolean
    ready: boolean
}

export function PlayerCard({ name, avatar, isHost, ready }: PlayerCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-3 flex items-center space-x-3 border-2 border-yellow-400">
            <div className="relative flex-shrink-0">
                <Image
                    src={`/avatars/${avatar}.png`}
                    alt={`${name}'s avatar`}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-purple-500"
                />
                {isHost && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs font-bold px-1 py-0.5 rounded-full">Host</span>
                )}
            </div>
            <div className="flex-grow min-w-0">
                <h3 className="text-sm font-bold text-purple-700 truncate">{name}</h3>
                {ready && (
                    <span className="text-xs text-green-500 font-semibold">Ready!</span>
                )}
            </div>
        </div>
    )
}


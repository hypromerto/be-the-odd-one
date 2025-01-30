import Image from "next/image"
import { useTranslations } from "next-intl"

interface PlayerCardProps {
    name: string
    avatar: string
    isHost: boolean
}

export function PlayerCard({ name, avatar, isHost }: PlayerCardProps) {
    const t = useTranslations("PlayerCard")
    return (
        <div className="bg-white rounded-lg shadow-md p-3 flex items-center space-x-3 border-2 border-yellow-400 w-full mb-2">
            <div className="relative flex-shrink-0">
                <Image
                    src={`/avatars/${avatar}.png`}
                    alt={`${name}'s avatar`}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-purple-500"
                />
                {isHost && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs font-bold px-1 py-0.5 rounded-full">
            {t("host")}
          </span>
                )}
            </div>
            <div className="flex-grow min-w-0 flex flex-col">
                <h3 className="text-sm font-bold text-purple-700 truncate">{name}</h3>
            </div>
        </div>
    )
}


import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Crown, Users } from "lucide-react"

interface Player {
    id: string
    name: string
    avatar: string
    is_host: boolean
    ready: boolean
}

interface PlayerListProps {
    players: Player[]
    variant?: "horizontal" | "vertical"
}

export function PlayerList({ players, variant = "horizontal" }: PlayerListProps) {
    const t = useTranslations("PlayerList")

    return (
        <div className="space-y-6 ">
            <div className={`grid ${variant === "vertical" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-4`}>
                {players.map((player) => (
                    <div
                        key={player.id}
                        className={`flex items-center space-x-4 bg-white/80 p-4 rounded-xl transition-all duration-300 
              hover:bg-white hover:shadow-md border-2 border-indigo-100 hover:border-indigo-300
              ${variant === "vertical" ? "lg:p-5" : ""}`}
                    >
                        <Avatar className={`border-2 border-indigo-300 ${variant === "vertical" ? "h-16 w-16" : "h-12 w-12"}`}>
                            <AvatarImage src={`/avatars/${player.avatar}.png`} alt={player.name} />
                            <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="flex-grow">
                            <p className={`font-medium text-indigo-800 ${variant === "vertical" ? "text-lg" : "text-sm"}`}>
                                {player.name}
                            </p>
                            {player.ready && (
                                <span className="inline-flex items-center text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full mt-1">
                  {t("ready")}
                </span>
                            )}
                        </div>

                        {player.is_host && (
                            <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                                <Crown className="h-3 w-3 mr-1" />
                                {t("host")}
                            </Badge>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}


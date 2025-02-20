import Image from "next/image"
import { useTranslations } from "next-intl"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"
import type { Player } from "@/lib/types"

interface CompactPlayerListProps {
    players: Player[]
}

export function CompactPlayerList({ players }: CompactPlayerListProps) {
    const t = useTranslations("PlayerList")

    return (
        <div className="bg-white/55 backdrop-blur-sm rounded-lg shadow-md p-2 mb-2">
            <h3 className="text-lg font-semibold text-indigo-800 mb-2 px-3">{t("players")}</h3>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-4 p-3">
                    {players.map((player) => (
                        <div key={player.id} className="flex flex-col items-center">
                            <div className="relative">
                                <Image
                                    src={`/avatars/${player.avatar}.png`}
                                    alt={`${player.name}'s avatar`}
                                    width={40}
                                    height={40}
                                    className="rounded-full border-2 border-indigo-500"
                                />
                                {player.is_host && (
                                    <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-800 p-1">
                                        <Crown className="h-3 w-3" />
                                    </Badge>
                                )}
                            </div>
                            <span className="text-xs mt-1 font-medium text-indigo-700 truncate max-w-[60px]">{player.name}</span>
                            {player.ready && <span className="text-xs text-green-600 font-semibold">{t("ready")}</span>}
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}


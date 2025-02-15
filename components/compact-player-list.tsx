import Image from "next/image"
import { useTranslations } from "next-intl"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { Player } from "@/lib/types"

interface CompactPlayerListProps {
    players: Player[]
}

export function CompactPlayerList({ players }: CompactPlayerListProps) {
    const t = useTranslations("PlayerCard")

    return (
        <div className="bg-white/55 backdrop-blur-sm rounded-lg shadow-md p-2 mb-2">
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
                                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs font-bold px-1 py-0.5 rounded-full">
                    {t("host")}
                  </span>
                                )}
                            </div>
                            <span className="text-xs mt-1 font-medium text-indigo-700 truncate max-w-[60px]">{player.name}</span>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}


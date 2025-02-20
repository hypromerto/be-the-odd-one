"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"

interface PlayerCardProps {
    name: string
    avatar: string
    isHost: boolean
    ready: boolean
}

export function PlayerCard({ name, avatar, isHost, ready }: PlayerCardProps) {
    const t = useTranslations("PlayerCard")
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-3 flex items-center space-x-3 border-2 border-yellow-400 w-full mb-2"
        >
            <div className="relative flex-shrink-0">
                <Image
                    src={`/avatars/${avatar}.png`}
                    alt={`${name}'s avatar`}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-indigo-500"
                />
                {isHost && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs font-bold px-1 py-0.5 rounded-full">
            {t("host")}
          </span>
                )}
            </div>
            <div className="flex-grow min-w-0 flex flex-col">
                <h3 className="text-sm font-bold text-indigo-700 truncate">{name}</h3>
                {ready && <span className="text-xs text-green-500 font-semibold">{t("ready")}</span>}
            </div>
        </motion.div>
    )
}


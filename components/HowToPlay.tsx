"use client"

import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { PenTool, Zap, Award, Trophy, Sparkles, Users, PackageOpen } from 'lucide-react'
import { useGameChannel } from "@/contexts/GameChannelContext"

const HowToPlay = () => {
    const t = useTranslations("Lobby")
    const { state: gameState } = useGameChannel()

    const isThemePackSelected = gameState?.theme_source === "pack"

    const steps = [
        {
            icon: isThemePackSelected ? PackageOpen : PenTool,
            text: isThemePackSelected ? "step1ThemePack" : "step1Custom",
            title: isThemePackSelected ? "stepTitle1ThemePack" : "stepTitle1Custom",
            color: "bg-teal-500",
            delay: 0.2,
            className: "text-teal-500",
        },
        {
            icon: Zap,
            text: "step2",
            title: "stepTitle2",
            color: "bg-orange-500",
            delay: 0.4,
            className: "text-orange-500",
        },
        {
            icon: Award,
            text: "step3",
            title: "stepTitle3",
            color: "bg-pink-500",
            delay: 0.6,
            className: "text-pink-500",
        },
        {
            icon: Trophy,
            text: "step4",
            title: "stepTitle4",
            color: "bg-sky-500",
            delay: 0.8,
            className: "text-sky-500",
        },
    ]

    return (
        <div className="h-full flex flex-col rounded-xl ">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <h2 className="text-2xl font-bold text-indigo-600 mb-2">{t("howToPlay")}</h2>
                <p className="text-gray-500">{t("gameObjectiveDesc")}</p>
            </motion.div>

            <div className="flex-1 grid grid-cols-2 gap-6 place-content-center">
                <AnimatePresence mode="wait">
                    {steps.map((step, index) => (
                        <motion.div
                            key={`${index}-${isThemePackSelected}`}
                            className="flex flex-col items-center text-center group"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{
                                delay: step.delay,
                                duration: 0.3,
                                type: "spring",
                                stiffness: 100,
                            }}
                        >
                            <motion.div
                                className={`${step.color} p-4 rounded-full mb-4 group-hover:scale-110 transition-transform`}
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.5 }}
                            >
                                <step.icon className="w-8 h-8 text-white" />
                            </motion.div>
                            <motion.p
                                className={`text-base ${step.className} font-medium mb-2`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: step.delay + 0.2 }}
                            >
                                {t(step.title)}
                            </motion.p>
                            <motion.p
                                className="text-sm text-gray-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: step.delay + 0.3 }}
                            >
                                {t(step.text)}
                            </motion.p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <motion.div
                className="mt-4 flex items-center justify-center space-x-2 text-gray-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
            >
                <Users className="w-4 h-4" />
                <span>{t("minPlayers")}</span>
            </motion.div>
        </div>
    )
}

export default HowToPlay
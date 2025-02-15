"use client"

import type React from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface FirstAnswerDisplayProps {
    playerName: string
}

const FirstAnswerDisplay: React.FC<FirstAnswerDisplayProps> = ({ playerName }) => {
    const t = useTranslations("FirstAnswerDisplay")
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
                <CardContent className="p-3 flex items-center space-x-3">
                    <div className="bg-yellow-400 rounded-full p-2">
                        <AlertCircle className="w-5 h-5 text-indigo-800" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-indigo-800">{t("playerAnswered", { playerName })}</p>
                        <p className="text-xs text-indigo-600">{t("timeRemaining")}</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

export default FirstAnswerDisplay


"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CircularProgressbar } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"

interface RoundStartCountdownProps {
    onComplete: () => void
}

const RoundStartCountdown: React.FC<RoundStartCountdownProps> = ({ onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(3)
    const t = useTranslations("RoundStartCountdown")

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            onComplete()
        }
    }, [timeLeft, onComplete])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700 text-center">
                        {t("roundStarting")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                    <p className="text-lg text-center text-indigo-600">{t("getReady")}</p>
                    <div className="w-24 h-24">
                        <CircularProgressbar
                            value={(timeLeft / 3) * 100}
                            text={`${timeLeft}`}
                            styles={{
                                path: {
                                    stroke: `rgba(234, 179, 8, ${timeLeft / 3})`,
                                    strokeLinecap: 'round',
                                    transition: 'stroke-dashoffset 0.5s ease 0s',
                                },
                                trail: {
                                    stroke: '#d6d6d6',
                                },
                                text: {
                                    fill: '#eab308',
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                },
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

export default RoundStartCountdown
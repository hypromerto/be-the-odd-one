"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { motion } from "framer-motion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Globe } from "lucide-react"
import {createClient} from "@/utils/supabase/client";

interface ThemePack {
    id: number
    title: string
    icon: string
    language: string
}

interface Language {
    code: string
    name: string
}

interface ThemePackSelectorProps {
    isHost: boolean
    selectedThemePack: number | null
    onThemePackSelect: (themePackId: number) => void
}

export default function ThemePackSelector({ isHost, selectedThemePack, onThemePackSelect }: ThemePackSelectorProps) {
    const supabase = createClient()
    const [themePacks, setThemePacks] = useState<ThemePack[]>([])
    const t = useTranslations("ThemePackSelector")
    const [selectedLanguage, setSelectedLanguage] = useState<string>("en")
    const languages: Language[] = [
        { code: "en", name: "English"},
        { code: "tr", name: "Türkçe"},
    ]

    useEffect(() => {
        fetchThemePacks(selectedLanguage)
    }, [selectedLanguage])

    const fetchThemePacks = async (lang: string) => {
        let query = supabase.from("theme_packs").select("*").eq("language", lang)
        const { data, error } = await query.order("title")
        setThemePacks(data)
    }

    const handleThemePackSelect = (themePackId: number) => {
        if (!isHost) return
        onThemePackSelect(themePackId)
    }

    const handleLanguageChange = (lang: string) => {
        setSelectedLanguage(lang)
    }

    return (
        <div className="space-y-4">
            <Card className="w-full bg-white/90 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Globe className="w-5 h-5 text-indigo-600" />
                        <Label className="text-sm font-medium text-indigo-800">{t("selectLanguage")}</Label>
                    </div>
                    <RadioGroup value={selectedLanguage} onValueChange={handleLanguageChange} className="flex space-x-4">
                        {languages.map((lang) => (
                            <div key={lang.code} className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value={lang.code}
                                    id={`lang-${lang.code}`}
                                    className="w-4 h-4 border-2 border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Label htmlFor={`lang-${lang.code}`} className="flex items-center space-x-1 text-sm cursor-pointer">
                                    <span className="text-indigo-700">{lang.name}</span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
            </Card>

            <h3 className="text-lg font-semibold text-indigo-800">{t("selectThemePack")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {themePacks.map((pack) => (
                    <motion.div key={pack.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Card
                            className={`cursor-pointer transition-all duration-200 ${
                                selectedThemePack === pack.id
                                    ? "border-2 border-indigo-500 bg-indigo-100 shadow-lg"
                                    : "border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                            onClick={() => handleThemePackSelect(pack.id)}
                        >
                            <CardContent className="p-4 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-indigo-200 flex items-center justify-center mb-2">
                                    <Image
                                        src={`/theme-icons/${pack.icon}.png`}
                                        alt={pack.title}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                    />
                                </div>
                                <p className="text-sm font-medium text-center text-indigo-700">{pack.title}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}


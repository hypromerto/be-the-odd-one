"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useGameChannel, useUpdateGameSettings } from "@/contexts/GameChannelContext"
import ThemePackSelector from "./theme-pack-selector"
import { Clock, PencilRuler, PackageOpen } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface GameSettingsProps {
    roomId: string
    isHost: boolean
}

export default function GameSettings({ roomId, isHost }: GameSettingsProps) {
    const supabase = createClient()
    const [isTimedMode, setIsTimedMode] = useState(false)
    const [localNumThemes, setLocalNumThemes] = useState(5)
    const [themeSource, setThemeSource] = useState<"custom" | "pack">("custom")
    const [selectedThemePack, setSelectedThemePack] = useState<number | null>(null)
    const { state: gameState, dispatch } = useGameChannel()
    const t = useTranslations("GameSettings")
    const updateGameSettings = useUpdateGameSettings(roomId)

    useEffect(() => {
        if (!gameState) return

        setIsTimedMode(gameState.is_timed_mode)
        setLocalNumThemes(gameState.num_themes)
        setThemeSource(gameState.theme_source)
        setSelectedThemePack(gameState.selected_theme_pack_id)
    }, [gameState])

    const handleSettingsChange = (
        updates: Partial<{
            isTimedMode: boolean
            selectedThemePack: number | null
            numThemes: number
            themeSource: "custom" | "pack"
        }>,
    ) => {
        if (!isHost) return

        const updatedSettings = {
            isTimedMode: updates.isTimedMode ?? isTimedMode,
            selectedThemePack: updates.selectedThemePack ?? selectedThemePack,
            numThemes: updates.numThemes ?? localNumThemes,
            themeSource: updates.themeSource ?? themeSource,
        }

        setIsTimedMode(updatedSettings.isTimedMode)
        setSelectedThemePack(updatedSettings.selectedThemePack)
        setLocalNumThemes(updatedSettings.numThemes)
        setThemeSource(updatedSettings.themeSource)

        updateGameSettings(updatedSettings)
    }

    const handleTimedModeChange = (checked: boolean) => {
        handleSettingsChange({
            isTimedMode: checked,
        })
    }

    const handleThemeSourceChange = (value: "custom" | "pack") => {
        handleSettingsChange({
            themeSource: value,
            selectedThemePack: value === "pack" ? selectedThemePack || 1 : null,
            numThemes: value === "pack" ? localNumThemes : 0,
        })
    }

    const handleThemePackSelect = (themePackId: number) => {
        setSelectedThemePack(themePackId)
        handleSettingsChange({ selectedThemePack: themePackId })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-indigo-100 p-3 rounded-lg">
                <Label htmlFor="timed-mode" className="text-sm font-medium text-indigo-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                    {t("timedMode")}
                </Label>
                <Switch
                    id="timed-mode"
                    checked={isTimedMode}
                    onCheckedChange={handleTimedModeChange}
                    disabled={!isHost}
                    className="data-[state=checked]:bg-indigo-600"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="theme-source" className="text-sm font-medium text-indigo-800">
                    {t("themeSource")}
                </Label>
                <RadioGroup
                    id="theme-source"
                    value={themeSource}
                    onValueChange={handleThemeSourceChange}
                    className="grid grid-cols-2 gap-4"
                    disabled={!isHost}
                >
                    <div className="relative">
                        <RadioGroupItem value="custom" id="custom" className="peer sr-only" disabled={!isHost} />
                        <Label
                            htmlFor="custom"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-indigo-50 p-4 hover:bg-indigo-100 hover:border-indigo-300 peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-200 [&:has([data-state=checked])]:border-indigo-500 [&:has([data-state=checked])]:bg-indigo-200 cursor-pointer h-full"
                        >
                            <PencilRuler className="mb-3 h-6 w-6 text-indigo-600" />
                            <span className="text-sm font-medium text-indigo-800">{t("customThemes")}</span>
                        </Label>
                    </div>
                    <div className="relative">
                        <RadioGroupItem value="pack" id="pack" className="peer sr-only" disabled={!isHost} />
                        <Label
                            htmlFor="pack"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-indigo-50 p-4 hover:bg-indigo-100 hover:border-indigo-300 peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-200 [&:has([data-state=checked])]:border-indigo-500 [&:has([data-state=checked])]:bg-indigo-200 cursor-pointer h-full"
                        >
                            <PackageOpen className="mb-3 h-6 w-6 text-indigo-600" />
                            <span className="text-sm font-medium text-indigo-800">{t("themePacks")}</span>
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {themeSource === "pack" && (
                <>
                    <ThemePackSelector
                        isHost={isHost}
                        selectedThemePack={selectedThemePack}
                        onThemePackSelect={handleThemePackSelect}
                    />
                    <div className="space-y-2">
                        <Label htmlFor="num-themes" className="text-sm font-medium text-indigo-800 flex items-center">
                            <PencilRuler className="w-5 h-4 mr-2 text-indigo-600" />
                            {t("numberOfThemesFromPack")} ({localNumThemes})
                        </Label>
                        <div className="relative pt-1">
                            <Slider
                                id="num-themes"
                                min={1}
                                max={10}
                                step={1}
                                value={[localNumThemes]}
                                onValueChange={(value) => setLocalNumThemes(value[0])}
                                onValueCommit={(value) => handleSettingsChange({ numThemes: value[0] })}
                                disabled={!isHost}
                                className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-indigo-600 px-2 mt-2">
                                <span>1</span>
                                <span>5</span>
                                <span>10</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!isHost && (
                <p className="text-sm text-indigo-500 italic bg-indigo-50 p-2 rounded-md border border-indigo-200">
                    {t("onlyHostCanChange")}
                </p>
            )}
        </div>
    )
}


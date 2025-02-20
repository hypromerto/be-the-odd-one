"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { useTranslations } from "next-intl"

export function HelpDialog() {
    const t = useTranslations("HowToPlay")

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <HelpCircle className="h-6 w-6 text-indigo-600" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-indigo-800 mb-4">{t("title")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-indigo-700">{t("gameObjective")}</h3>
                        <p className="text-indigo-600">{t("gameObjectiveDesc")}</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-indigo-700">{t("howToPlayTitle")}</h3>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((step) => (
                                <div key={step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                    {step}
                  </span>
                                    <p className="text-indigo-600">{t(`step${step}`)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-indigo-700">{t("scoringTitle")}</h3>
                        <p className="text-indigo-600">{t("scoringDesc")}</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-indigo-700">{t("tipsTitle")}</h3>
                        <ul className="list-disc list-inside space-y-2 text-indigo-600">
                            {[1, 2, 3].map((tip) => (
                                <li key={tip}>{t(`tip${tip}`)}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


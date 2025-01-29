"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function LanguageSwitcher() {
    const t = useTranslations("LanguageSwitcher")
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
        router.push(newPath)
    }

    if (!mounted) return null

    return (
        <Button
            onClick={() => switchLocale(locale === "en" ? "tr" : "en")}
            className="fixed top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1 px-2"
        >
            {locale === "en" ? t("switchToTurkish") : t("switchToEnglish")}
        </Button>
    )
}


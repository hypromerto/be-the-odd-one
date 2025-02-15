"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
]

export default function LanguageSwitcher() {
    const t = useTranslations("LanguageSwitcher")
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
        router.push(newPath)
        setIsOpen(false)
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 px-0">
                    <Globe className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                    <span className="sr-only">{t("switchLanguage")}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => switchLocale(lang.code)}
                        className="flex items-center gap-2 px-3 py-2"
                    >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


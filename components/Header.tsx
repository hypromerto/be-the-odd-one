"use client"

import { useState } from "react"
import Link from "next/link"
import {useLocale, useTranslations} from "next-intl"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import LanguageSwitcher from "./LanguageSwitcher"
import { HelpDialog } from "./HelpDialog"
import {getFullUrl} from "@/utils/url";

const Header = () => {
    const t = useTranslations("Header")
    const [isOpen, setIsOpen] = useState(false)
    const locale = useLocale()

    const menuItems = [
        { href: "/", label: t("home") },
        { href: `/privacy`, label: t("privacy") },
        { href: `/terms`, label: t("termsOfService") },
    ]

    return (
        <header className="z-50 bg-transparent">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                {/* Mobile Menu */}
                <div className="lg:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-8 w-8 text-indigo-600" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white/80 backdrop-blur-md">
                            <nav className="flex flex-col space-y-4 mt-8">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={getFullUrl(item.href, locale)}
                                        className="text-lg font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Desktop Logo */}
                <Link href="/" className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors">
                    <Image src="/be-the-odd-one.png" alt="Be the Odd One" width={42} height={42}/>
                    <span className="text-xl lg:text-3xl  font-bold ml-2">Be the Odd One</span>
                </Link>

                {/* Right side icons */}
                <div className="flex items-center space-x-4">
                    <LanguageSwitcher />
                    <HelpDialog />
                </div>
            </div>
        </header>
    )
}

export default Header


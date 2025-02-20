import { useTranslations } from "next-intl"
import Link from "next/link"

const Footer = () => {
    const t = useTranslations("Footer")

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50">
            {/* Mobile Footer */}
            <div className="lg:hidden bg-indigo-800/90 text-white py-1">
                <div className="container mx-auto text-center text-xs">
                    <p className="inline-block mr-2">&copy; {new Date().getFullYear()} Be the Odd One.</p>
                    <a href="/privacy" className="hover:text-indigo-200 transition-colors mr-2">
                        {t("privacyPolicy")}
                    </a>
                    <a href="/terms" className="hover:text-indigo-200 transition-colors">
                        {t("termsOfService")}
                    </a>
                </div>
            </div>

            {/* Desktop Footer */}
            <div className="hidden lg:block">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex justify-end space-x-6">
                        <Link href="/privacy" className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm">
                            {t("privacyPolicy")}
                        </Link>
                        <Link href="/terms" className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm">
                            {t("termsOfService")}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer


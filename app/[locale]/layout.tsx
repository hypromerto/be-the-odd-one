import "../globals.css"
import { Inter } from "next/font/google"
import { notFound } from "next/navigation"
import { NextIntlClientProvider } from "next-intl"
import type React from "react"
import { routing } from "@/i18n/routing"
import { getMessages } from "next-intl/server"
import Script from "next/script"
import { GoogleAnalytics } from "@next/third-parties/google"
import { Toaster } from "@/components/ui/toaster"
import Header from "@/components/Header"
import PlayfulBackground from "@/components/PlayfulBackground"

const inter = Inter({ subsets: ["latin"] })
const AdsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID

export default async function RootLayout({
                                             children,
                                             params: { locale },
                                         }: {
    children: React.ReactNode
    params: { locale: string }
}) {
    if (!routing.locales.includes(locale as any)) {
        notFound()
    }

    const messages = await getMessages()

    return (
        <html lang={locale}>
        <head>
            <title>Be the Odd One</title>
            <Script src="https://www.google.com/recaptcha/api.js" async defer />
            <script
                async
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9435164855607747"
                crossOrigin="anonymous"
            ></script>
            <GoogleAnalytics gaId="G-9XRSFJ4S84" />
            <link rel="icon" href="/icon?<generated>" type="image/png" sizes="32x32" />
        </head>
        <body className={`${inter.className} min-h-screen flex flex-col relative bg-gradient-to-b from-amber-200 to-indigo-200`}>
        <PlayfulBackground />
        <NextIntlClientProvider locale={locale} messages={messages}>
            <Header />
            <main className="flex-grow relative grid">{children}</main>
            <footer className="hidden lg:block py-4 text-center text-sm text-indigo-600/80 backdrop-blur-sm">
                <div className="container mx-auto">
                    <div className="space-x-4">
                        <a href="/privacy-policy" className="hover:text-indigo-800 transition-colors">
                            Privacy Policy
                        </a>
                        <span>•</span>
                        <a href="/terms-of-service" className="hover:text-indigo-800 transition-colors">
                            Terms of Service
                        </a>
                    </div>
                    <div className="mt-2">© {new Date().getFullYear()} Be the Odd One. All rights reserved.</div>
                </div>
            </footer>
            <Toaster />
        </NextIntlClientProvider>
        </body>
        </html>
    )
}


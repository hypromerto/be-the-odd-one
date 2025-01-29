import "../globals.css"
import {Inter} from "next/font/google"
import {notFound} from "next/navigation"
import {NextIntlClientProvider} from "next-intl"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import type React from "react"
import {routing} from "@/i18n/routing";
import {getMessages} from "next-intl/server";

const inter = Inter({subsets: ["latin"]})

export default async function RootLayout({
                                             children,
                                             params: {locale},
                                         }: {
    children: React.ReactNode
    params: { locale: string }
}) {
    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale}>
        <body className={`${inter.className} bg-gradient-to-b from-amber-200 to-indigo-700 min-h-screen`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
            <LanguageSwitcher/>
            {children}
        </NextIntlClientProvider>
        </body>
        </html>
    )
}


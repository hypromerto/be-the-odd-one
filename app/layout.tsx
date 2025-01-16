import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className={`${inter.className} bg-gradient-to-b from-amber-200 to-indigo-700 min-h-screen`}>
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            {children}
        </div>
        </body>
        </html>
    )
}


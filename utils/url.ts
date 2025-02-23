export function getFullUrl(path: string, locale: string): string {
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://betheoddone.com"

    if (typeof window !== "undefined") {
        baseUrl = window.location.origin
    }

    return `${baseUrl}/${locale}${path}`
}


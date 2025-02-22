import { useTranslations } from "next-intl"
import PlayfulBackground from "@/components/PlayfulBackground"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

export default function PrivacyPolicy() {
    const t = useTranslations("PrivacyPolicy")

    return (
        <div className="min-h-screen flex flex-col">
            <PlayfulBackground />
            <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
                <div className="bg-card/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
                    <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
                    <div className="space-y-4">
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("introduction.title")}</h2>
                            <p>{t("introduction.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("informationCollection.title")}</h2>
                            <p>{t("informationCollection.content")}</p>
                            <ul className="list-disc pl-5 mt-2">
                                <li>{t("informationCollection.items.personal")}</li>
                                <li>{t("informationCollection.items.usage")}</li>
                                <li>{t("informationCollection.items.cookies")}</li>
                            </ul>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("informationUse.title")}</h2>
                            <p>{t("informationUse.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("dataSharing.title")}</h2>
                            <p>{t("dataSharing.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("cookies.title")}</h2>
                            <p>{t("cookies.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("security.title")}</h2>
                            <p>{t("security.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("changes.title")}</h2>
                            <p>{t("changes.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("contact.title")}</h2>
                            <p>{t("contact.content")}</p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}


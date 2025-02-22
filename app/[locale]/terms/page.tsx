import { useTranslations } from "next-intl"
import PlayfulBackground from "@/components/PlayfulBackground"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

export default function TermsOfService() {
    const t = useTranslations("TermsOfService")

    return (
        <div className="min-h-screen flex flex-col">
            <PlayfulBackground />
            <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
                <div className="bg-card/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
                    <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
                    <div className="space-y-4">
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("acceptance.title")}</h2>
                            <p>{t("acceptance.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("useOfService.title")}</h2>
                            <p>{t("useOfService.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("userAccounts.title")}</h2>
                            <p>{t("userAccounts.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("intellectualProperty.title")}</h2>
                            <p>{t("intellectualProperty.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("userContent.title")}</h2>
                            <p>{t("userContent.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("prohibitedConduct.title")}</h2>
                            <p>{t("prohibitedConduct.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("termination.title")}</h2>
                            <p>{t("termination.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("disclaimer.title")}</h2>
                            <p>{t("disclaimer.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("limitationOfLiability.title")}</h2>
                            <p>{t("limitationOfLiability.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("changes.title")}</h2>
                            <p>{t("changes.content")}</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-semibold mb-2">{t("governingLaw.title")}</h2>
                            <p>{t("governingLaw.content")}</p>
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


import type React from "react"
import { useTranslations } from "next-intl"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { ExternalLink, Shield, Cookie, Users, Bell, Lock, Baby, RefreshCw, Mail } from "lucide-react"

export default function PrivacyPolicy() {
    const t = useTranslations("PrivacyPolicy")

    const Section = ({
                         title,
                         children,
                         icon: Icon,
                     }: {
        title: string
        children: React.ReactNode
        icon: React.ComponentType<{ className?: string }>
    }) => (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <Icon className="w-6 h-6 text-indigo-500" />
                <h2 className="text-2xl font-semibold">{title}</h2>
            </div>
            {children}
        </section>
    )

    const List = ({ items }: { items: string[] }) => (
        <ul className="list-disc pl-5 space-y-2">
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    )

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
                <Card className="max-w-4xl mx-auto bg-card/80 backdrop-blur-sm shadow-lg p-8">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="text-center">
                            <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
                            <p className="text-sm text-muted-foreground">{t("lastUpdated")}</p>
                        </div>

                        <Separator />

                        {/* Introduction */}
                        <Section title={t("introduction.title")} icon={Shield}>
                            <p>{t("introduction.content")}</p>
                        </Section>

                        {/* Information Collection */}
                        <Section title={t("informationCollection.title")} icon={Users}>
                            <p className="mb-4">{t("informationCollection.content")}</p>
                            <List
                                items={[
                                    t("informationCollection.items.personal"),
                                    t("informationCollection.items.usage"),
                                    t("informationCollection.items.device"),
                                    t("informationCollection.items.cookies"),
                                ]}
                            />
                        </Section>

                        {/* Cookies and Advertising */}
                        <Section title={t("cookies.title")} icon={Cookie}>
                            <div className="space-y-4">
                                <p>{t("cookies.content")}</p>
                                <p>{t("cookies.thirdPartyVendors")}</p>
                                <p>{t("cookies.personalization")}</p>
                                <p className="flex items-center gap-2">
                                    {t("cookies.optOut")}
                                    <ExternalLink className="w-4 h-4" />
                                </p>
                            </div>
                        </Section>

                        {/* Data Use */}
                        <Section title={t("dataUse.title")} icon={Bell}>
                            <p className="mb-4">{t("dataUse.content")}</p>
                            <List
                                items={[
                                    t("dataUse.items.operation"),
                                    t("dataUse.items.personalization"),
                                    t("dataUse.items.communication"),
                                    t("dataUse.items.advertising"),
                                    t("dataUse.items.analytics"),
                                ]}
                            />
                        </Section>

                        {/* Data Sharing */}
                        <Section title={t("dataSharing.title")} icon={Users}>
                            <p className="mb-4">{t("dataSharing.content")}</p>
                            <List
                                items={[
                                    t("dataSharing.items.serviceProviders"),
                                    t("dataSharing.items.advertising"),
                                    t("dataSharing.items.legal"),
                                    t("dataSharing.items.business"),
                                ]}
                            />
                        </Section>

                        {/* Security */}
                        <Section title={t("security.title")} icon={Lock}>
                            <p>{t("security.content")}</p>
                        </Section>

                        {/* Children's Privacy */}
                        <Section title={t("childPrivacy.title")} icon={Baby}>
                            <p>{t("childPrivacy.content")}</p>
                        </Section>

                        {/* Changes */}
                        <Section title={t("changes.title")} icon={RefreshCw}>
                            <p>{t("changes.content")}</p>
                        </Section>

                        {/* Contact */}
                        <Section title={t("contact.title")} icon={Mail}>
                            <p>{t("contact.content")}</p>
                        </Section>
                    </div>
                </Card>
            </main>
        </div>
    )
}


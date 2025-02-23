import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Shield,
    Users,
    Code,
    MessageSquare,
    Ban,
    Power,
    AlertTriangle,
    Scale,
    Pencil,
    Book,
    Mail,
    Info,
    CheckCircle,
    Gavel,
} from "lucide-react"

const Section = ({ title, content, icon: Icon }) => (
    <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center">
            <Icon className="w-6 h-6 mr-2 text-indigo-500" />
            {title}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{content}</p>
    </div>
)

export default function TermsOfService() {
    const t = useTranslations("TermsOfService")

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
                <Card className="backdrop-blur-md bg-white/30 border-indigo-200/30 shadow-xl">
                    <CardContent className="p-6">
                        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-900 dark:text-indigo-100">{t("title")}</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">{t("lastUpdated")}</p>

                        <Section title={t("introduction.title")} content={t("introduction.content")} icon={Info} />
                        <Separator className="my-4" />

                        <Section title={t("acceptance.title")} content={t("acceptance.content")} icon={CheckCircle} />
                        <Separator className="my-4" />

                        <Section title={t("useOfService.title")} content={t("useOfService.content")} icon={Shield} />
                        <Separator className="my-4" />

                        <Section title={t("userAccounts.title")} content={t("userAccounts.content")} icon={Users} />
                        <Separator className="my-4" />

                        <Section title={t("userContent.title")} content={t("userContent.content")} icon={MessageSquare} />
                        <Separator className="my-4" />

                        <Section title={t("intellectualProperty.title")} content={t("intellectualProperty.content")} icon={Code} />
                        <Separator className="my-4" />

                        <Section title={t("prohibitedConduct.title")} content={t("prohibitedConduct.content")} icon={Ban} />
                        <Separator className="my-4" />

                        <Section title={t("termination.title")} content={t("termination.content")} icon={Power} />
                        <Separator className="my-4" />

                        <Section title={t("disclaimer.title")} content={t("disclaimer.content")} icon={AlertTriangle} />
                        <Separator className="my-4" />

                        <Section
                            title={t("limitationOfLiability.title")}
                            content={t("limitationOfLiability.content")}
                            icon={Scale}
                        />
                        <Separator className="my-4" />

                        <Section title={t("changes.title")} content={t("changes.content")} icon={Pencil} />
                        <Separator className="my-4" />

                        <Section title={t("contact.title")} content={t("contact.content")} icon={Mail} />
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}


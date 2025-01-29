import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { Theme } from "@/lib/types"

interface SharedThemePoolProps {
    themes: Theme[]
    isHost: boolean
    onRemove: (themeId: number) => void
}

export function SharedThemePool({ themes, isHost, onRemove }: SharedThemePoolProps) {
    return (
        <Card className="w-full mt-4">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-indigo-800">Theme Pool</CardTitle>
            </CardHeader>
            <CardContent>
                {themes.length === 0 ? (
                    <p className="text-gray-500 italic">No themes submitted yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {themes.map((theme) => (
                            <li key={theme.id} className="flex justify-between items-center bg-indigo-50 p-2 rounded-md">
                                <span className="text-indigo-700">{theme.question}</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-indigo-500">by {theme.author.name}</span>
                                    {isHost && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemove(theme.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}


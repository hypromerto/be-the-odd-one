"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"

export function Toaster() {
    const { toasts } = useToast()

    return (
        <ToastProvider>
            <AnimatePresence>
                {toasts.map(({ id, title, description, action, ...props }) => (
                    <motion.div
                        key={id}
                        initial={{ opacity: 0, y: -50, scale: 0.3 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    >
                        <Toast {...props}>
                            <div className="flex items-center space-x-3">
                                <div className="bg-yellow-400 rounded-full p-2">
                                    <AlertCircle className="w-5 h-5 text-indigo-800" />
                                </div>
                                <div>
                                    {title && <ToastTitle>{title}</ToastTitle>}
                                    {description && <ToastDescription>{description}</ToastDescription>}
                                </div>
                            </div>
                            {action}
                            <ToastClose />
                        </Toast>
                    </motion.div>
                ))}
            </AnimatePresence>
            <ToastViewport />
        </ToastProvider>
    )
}


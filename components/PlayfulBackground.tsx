"use client"

import { useEffect, useRef } from "react"

const PlayfulBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)

        class Leaf {
            x: number
            y: number
            size: number
            speedY: number
            speedX: number
            color: string
            rotation: number
            rotationSpeed: number

            constructor() {
                this.x = Math.random() * canvas.width
                this.y = Math.random() * canvas.height - canvas.height
                this.size = Math.random() * 15 + 5 // Smaller leaves
                this.speedY = Math.random() * 0.3 + 0.1 // Slower falling speed
                this.speedX = Math.random() * 0.2 - 0.1 // Less horizontal movement
                this.color = this.getRandomColor()
                this.rotation = Math.random() * Math.PI * 2
                this.rotationSpeed = (Math.random() - 0.5) * 0.005 // Slower rotation
            }

            getRandomColor() {
                const colors = [
                    "rgba(255, 165, 0, 0.1)", // Orange
                    "rgba(255, 69, 0, 0.1)", // Red-Orange
                    "rgba(165, 42, 42, 0.1)", // Brown
                    "rgba(255, 215, 0, 0.1)", // Gold
                ]
                return colors[Math.floor(Math.random() * colors.length)]
            }

            draw() {
                ctx!.save()
                ctx!.translate(this.x, this.y)
                ctx!.rotate(this.rotation)
                ctx!.fillStyle = this.color
                ctx!.beginPath()
                ctx!.moveTo(0, -this.size / 2)
                ctx!.bezierCurveTo(this.size / 2, -this.size / 4, this.size / 2, this.size / 4, 0, this.size / 2)
                ctx!.bezierCurveTo(-this.size / 2, this.size / 4, -this.size / 2, -this.size / 4, 0, -this.size / 2)
                ctx!.fill()
                ctx!.restore()
            }

            update() {
                this.y += this.speedY
                this.x += Math.sin(this.y * 0.01) * this.speedX
                this.rotation += this.rotationSpeed

                if (this.y > canvas.height + this.size) {
                    this.y = -this.size
                    this.x = Math.random() * canvas.width
                }

                this.draw()
            }
        }

        const leaves: Leaf[] = []
        for (let i = 0; i < 30; i++) {
            leaves.push(new Leaf())
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            leaves.forEach((leaf) => {
                leaf.update()
            })

            requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener("resize", resizeCanvas)
        }
    }, [])

    return <canvas ref={canvasRef} className="fixed inset-0 z-0" style={{ opacity: 0.5 }} />
}

export default PlayfulBackground


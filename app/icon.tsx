import { ImageResponse } from "next/og"

export const size = {
    width: 32,
    height: 32,
}
export const contentType = "image/png"

export default function Icon() {
    return new ImageResponse(
        <div
            style={{
                background: "#4F46E5", // Indigo background
                width: "100%",
                height: "100%",
                borderRadius: "50%", // Make the overall shape circular
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden", // Ensure nothing spills outside the circle
            }}
        >
            <div
                style={{
                    width: "80%",
                    height: "80%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                }}
            >
                {/* Background bubbles */}
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: `${6 + i * 2}px`,
                            height: `${6 + i * 2}px`,
                            borderRadius: "50%",
                            background: "#E0E7FF", // Light indigo
                            opacity: 0.6,
                            top: `${15 + Math.sin(i * 2) * 8}px`,
                            left: `${15 + Math.cos(i * 2) * 8}px`,
                        }}
                    />
                ))}
                {/* Main "odd one out" bubble */}
                <div
                    style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "#FCD34D", // Amber
                        boxShadow: "0 0 4px #FCD34D",
                        zIndex: 1,
                    }}
                />
            </div>
        </div>,
        { ...size },
    )
}


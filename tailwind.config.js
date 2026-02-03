/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#0f172a',    // Slate 900
                    primary: '#2563eb', // Blue 600
                    accent: '#10b981',  // Emerald 500
                }
            }
        },
    },
    plugins: [],
}

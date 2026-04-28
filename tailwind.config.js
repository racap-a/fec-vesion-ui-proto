/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#153151',
                    primary: '#F4C867',
                    accent: '#10b981',
                }
            }
        },
    },
    plugins: [],
}

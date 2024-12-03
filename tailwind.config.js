/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./index.html",
            "./js/*.js"],
    theme: {
        extend: {
            fontFamily: {
                "roboto": ['roboto', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
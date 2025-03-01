module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "bg-black",
    "bg-opacity-50",
    "backdrop-blur-xl"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

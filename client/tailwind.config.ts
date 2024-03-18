import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        'height': 'height'
      },
    },
    fontFamily: {
      'nunito': ['nunito', 'sans-serif'],
      'borel-regular': ['borel-regular', 'cursive'],
    },
  },
  plugins: [
		require("tailwindcss-animated"),
	],
};

export default config;

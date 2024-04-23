import type { Config } from 'tailwindcss';
import extend from 'adent/tailwind.json';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './modules/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/frui-tailwind/**/*.{js,ts,jsx,tsx}',
    '../node_modules/frui-tailwind/**/*.{js,ts,jsx,tsx}',
    '../../node_modules/frui-tailwind/**/*.{js,ts,jsx,tsx}',
    './node_modules/adent/**/*.{js,ts,jsx,tsx}',
    './../node_modules/adent/**/*.{js,ts,jsx,tsx}',
    '../../node_modules/adent/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      ...extend
    },
  },
};
export default config;

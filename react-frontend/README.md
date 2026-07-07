# SpecterUI

Frontend developer portfolio, built with React, TypeScript, Vite, and Tailwind CSS.

## Stack

- [React 19](https://react.dev) with the [React Compiler](https://react.dev/learn/react-compiler) enabled
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) via [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)
- [Tailwind CSS 4](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [ESLint](https://eslint.org) with [typescript-eslint](https://typescript-eslint.io)

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check with `tsc -b` and build for production
- `npm run lint` — lint the project with ESLint
- `npm run preview` — preview the production build locally

## Expanding the ESLint configuration

This project lints with type-aware rules via `typescript-eslint`. See [eslint.config.js](eslint.config.js) for the current setup — it composes `@eslint/js` recommended rules, `typescript-eslint` recommended rules, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.

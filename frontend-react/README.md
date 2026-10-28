# Portal de distribuidores (React)

React 19 con TypeScript, React Router, TanStack Query y Vite. Es el front que usan los distribuidores para consultar su catálogo, preparar un pedido y seguirlo; administración y comerciales usan el back-office en Angular.

```bash
npm install
npm run dev     # http://localhost:5173, /api se redirige a la API en localhost:8080
npm test        # Vitest y Testing Library
npm run lint    # oxlint
npm run build   # comprobación de tipos y build de producción en dist/
```

## Estructura

```
src/api/         cliente HTTP (token, errores), endpoints y tipos
src/auth/        sesión en un contexto de React
src/cart/        carrito: reducer puro + contexto
src/pages/       una página por ruta
src/components/  piezas reutilizables (marco, estado, paginación)
```

Los datos del servidor los gestiona TanStack Query (caché, recarga, estados de carga y error). El estado que solo existe en el navegador, como la sesión y el carrito, vive en contextos de React.

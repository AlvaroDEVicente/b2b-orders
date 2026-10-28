# Front Angular de B2B Orders

Angular 22 con componentes standalone, signals, formularios reactivos y RxJS.

```bash
npm install
npm start          # http://localhost:4200, /api se redirige a la API en localhost:8080
npm run test:ci    # tests con Vitest
npx ng build       # build de producción en dist/
```

## Estructura

```
src/app/
  core/api/        tipos de la API, servicios HTTP y traducción de errores
  core/auth/       sesión (AuthService), interceptor JWT y guards por rol
  layout/          marco común: navegación según el rol
  shared/          componentes reutilizables (estado del pedido, etiquetas, validadores)
  features/        una carpeta por pantalla, cargada bajo demanda
```

En producción se sirve con nginx (`Dockerfile` y `nginx.conf.template`), que también reenvía `/api` a la API.

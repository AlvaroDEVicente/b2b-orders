# B2B Orders

Gestión de pedidos B2B para una distribuidora de accesorios con licencia de marca. Los distribuidores piden productos de las marcas que tienen licenciadas, los comerciales siguen los pedidos de sus clientes y administración calcula los royalties que se deben a cada marca.

Una sola API y dos fronts para dos públicos: un back-office en Angular para administración y comerciales, y un portal en React para que los distribuidores hagan sus pedidos.

La idea sale de mi experiencia en ventas B2B y gestión de licencias de marca: la regla central, que un distribuidor solo pueda pedir productos de marcas con licencia en vigor, es una regla real de ese negocio.

[![CI](https://github.com/AlvaroDEVicente/b2b-orders/actions/workflows/ci.yml/badge.svg)](https://github.com/AlvaroDEVicente/b2b-orders/actions/workflows/ci.yml)

## Tecnologías

| Parte | Tecnologías |
| --- | --- |
| API | Java 21, Spring Boot 4.1, Spring Data JPA (Hibernate), Spring Security con JWT, Flyway, OpenAPI/Swagger |
| Base de datos | PostgreSQL 17 |
| Back-office | Angular 22 (componentes standalone, signals, formularios reactivos, RxJS), TypeScript |
| Portal de distribuidores | React 19, TypeScript, React Router, TanStack Query, Vite |
| Tests | JUnit 5, Mockito, Testcontainers (backend); Vitest (Angular); Vitest y Testing Library (React) |
| Entrega | Docker, Docker Compose, GitHub Actions |

## Arrancarlo

Solo hace falta Docker:

```bash
docker compose up --build
```

- Back-office (Angular): http://localhost:4200
- Portal de distribuidores (React): http://localhost:5173
- Documentación de la API: http://localhost:8080/swagger-ui.html

Usuarios de demostración, todos con la contraseña `demo1234`:

| Email | Rol |
| --- | --- |
| `admin@example.com` | Administración: catálogo, clientes, licencias y royalties |
| `marcos.comercial@example.com` | Comercial con dos clientes asignados |
| `cliente.cantabrico@example.com` | Cliente: Móviles del Cantábrico S.L. (entra por los dos fronts) |
| `cliente.vera@example.com` | Cliente: TecnoVera Distribución S.L. (entra por los dos fronts) |

El portal de React solo admite usuarios cliente; el personal interno usa el back-office.

Las marcas y empresas de la demo son inventadas.

### Desarrollo sin Docker Compose

```bash
# API (necesita Docker solo para la base de datos de Testcontainers)
cd backend
./mvnw spring-boot:test-run      # arranca la API con un PostgreSQL temporal y datos de demo

# Angular, en otra terminal
cd frontend-angular
npm install
npm start                        # http://localhost:4200, con proxy de /api a localhost:8080

# React, en otra terminal
cd frontend-react
npm install
npm run dev                      # http://localhost:5173, con proxy de /api a localhost:8080
```

`spring-boot:test-run` usa `TestB2bOrdersApiApplication`, que levanta PostgreSQL en un contenedor. Para usar un PostgreSQL propio, arranca con `SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run` y las variables `DB_URL`, `DB_USER`, `DB_PASSWORD` y `JWT_SECRET` (al menos 32 caracteres; sin ella la API no arranca).

## Qué hace

- Ciclo de vida del pedido: borrador, confirmado, enviado y entregado, o cancelado desde borrador o confirmado.
- Al confirmar se comprueba otra vez la licencia y se descuenta el stock de todas las líneas, o de ninguna si falta alguna.
- Al cancelar un pedido confirmado se devuelve el stock.
- Cada rol ve solo lo suyo: un comercial, sus clientes; un cliente, su empresa. Los registros de otros responden 404.
- El catálogo de un cliente ya viene filtrado por sus licencias.
- Informe de royalties por marca y periodo, calculado con una consulta agregada en la base de datos.

## Estructura

```
backend/            API Spring Boot, organizada por funcionalidad (order/, product/, customer/...)
  src/main/resources/db/migration   esquema (Flyway)
  src/main/resources/db/demo        datos de demostración (perfil "demo")
frontend-angular/   Angular: core/ (API, auth), features/ (pantallas), shared/ (componentes)
frontend-react/     React: api/ (cliente HTTP), auth/ y cart/ (contextos), pages/, components/
docs/               guía de despliegue
docker-compose.yml  base de datos + API + los dos fronts
```

## Tests

```bash
cd backend && ./mvnw verify                  # 60 tests: unitarios y de integración contra PostgreSQL real
cd frontend-angular && npm run test:ci       # tests de Angular con Vitest
cd frontend-react && npm test                # tests de React con Vitest y Testing Library
```

GitHub Actions ejecuta las tres baterías y construye las imágenes Docker en cada push o pull request a `main`.

## Despliegue

Guía paso a paso para Railway en [docs/despliegue-railway.md](docs/despliegue-railway.md).

## Decisiones técnicas

- **Flyway** controla el esquema; Hibernate solo lo valida (`ddl-auto=validate`).
- **Modelo de dominio rico**: las reglas de estado y stock viven en las entidades `Order` y `Product`, no repartidas por los servicios.
- **JWT sin estado** con el resource server de Spring Security, roles con `@PreAuthorize` y autorización por dato en los servicios.
- **Errores RFC 9457** (`ProblemDetail`): todos los errores de la API tienen la misma forma.
- **Bloqueo pesimista al confirmar** (`SELECT ... FOR UPDATE`): pedidos simultáneos del mismo producto esperan su turno en lugar de fallar, y el stock nunca se descuadra. Hay un test que lo comprueba con varios hilos a la vez. `@Version` sigue protegiendo las demás modificaciones.
- **Testcontainers** en lugar de H2: los tests usan el mismo motor de base de datos que producción.
- **La API decide qué acciones se pueden hacer** sobre cada pedido (`availableActions`) y el front solo pinta esos botones.

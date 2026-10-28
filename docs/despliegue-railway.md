# Despliegue en Railway

Tres servicios dentro de un mismo proyecto de Railway: la base de datos, la API y el front. Solo el front tiene dirección pública; la API se alcanza por la red privada del proyecto, así que no queda expuesta a internet.

```
navegador ──HTTPS──▶ web (nginx + Angular) ──red privada──▶ api (Spring Boot) ──▶ Postgres
```

Coste: Railway cobra por uso. La API en Java es el servicio que más memoria consume (unos 300–400 MB en reposo). Revisa el consumo en el panel los primeros días.

## 1. Proyecto y base de datos

1. En Railway, crea un proyecto nuevo desde el repositorio de GitHub `AlvaroDEVicente/b2b-orders`.
2. Añade una base de datos PostgreSQL al proyecto. Railway la llama `Postgres` y le crea sus variables (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).

## 2. Servicio de la API

1. Crea un servicio desde el repositorio y llámalo `api`.
2. En la configuración del servicio, pon el directorio raíz en `/backend`. Railway detecta el `Dockerfile` y lo usa.
3. Variables del servicio (las referencias `${{...}}` las resuelve Railway):

| Variable | Valor |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| `DB_USER` | `${{Postgres.PGUSER}}` |
| `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `JWT_SECRET` | Una cadena aleatoria de al menos 32 caracteres. Genérala con `openssl rand -base64 48`. |
| `PORT` | `8080` |
| `SPRING_PROFILES_ACTIVE` | `demo` (carga los datos de demostración; quítalo para un entorno real) |

4. No le generes dominio público.

## 3. Servicio del front

1. Crea otro servicio desde el mismo repositorio y llámalo `web`.
2. Directorio raíz: `/frontend-angular`.
3. Variables:

| Variable | Valor |
| --- | --- |
| `API_URL` | `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:8080` |

4. Genera un dominio público para este servicio. Es la URL que pondrás en el CV.

Como el navegador solo habla con el dominio del front y nginx reenvía `/api/...` a la API, no hace falta configurar CORS en producción.

## 4. Comprobar

1. Abre el dominio público y entra con `admin@example.com` / `demo1234`.
2. Si la página carga pero el inicio de sesión falla, mira los registros del servicio `web`: un error de conexión con la API suele ser un `API_URL` mal escrito o la API todavía arrancando.
3. Si la API no arranca, sus registros dirán por qué. Los dos fallos más comunes son un `JWT_SECRET` de menos de 32 caracteres y una variable de base de datos mal referenciada.

Railway vuelve a desplegar cada servicio con cada push a `main`.

# Build the Angular app with Node, then serve the static files with nginx.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build

FROM nginx:1.29-alpine
# The official nginx image runs envsubst on /etc/nginx/templates/*.template at start-up,
# so PORT and API_URL can be set per environment (Docker Compose, Railway...) without rebuilding.
ENV PORT=80 \
    API_URL=http://api:8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend-angular/browser /usr/share/nginx/html
EXPOSE 80

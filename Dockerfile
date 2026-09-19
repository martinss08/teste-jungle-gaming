FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV CI=true
COPY package*.json ./

FROM base AS deps
RUN npm ci

FROM deps AS dev
ENV CI=false
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS build
COPY . .
ARG VITE_ENABLE_MSW=true
ENV VITE_ENABLE_MSW=$VITE_ENABLE_MSW
RUN npm run build

FROM node:24-bookworm-slim AS preview
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g vite@8.3.0
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD ["vite", "preview", "--host", "0.0.0.0", "--port", "4173"]

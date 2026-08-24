FROM node:24-bookworm-slim AS build

WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

COPY apps/web ./
ARG API_ORIGIN=http://webhook-inspector-api:8080
ENV API_ORIGIN=$API_ORIGIN
RUN npm run build

FROM node:24-bookworm-slim

ENV NODE_ENV=production
RUN apt-get update \
    && apt-get install --no-install-recommends --yes wget \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.ts ./next.config.ts

USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]

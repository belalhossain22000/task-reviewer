# Production image for the API.
#   docker build -t project-review-api server
#   docker run --env-file server/.env -p 5000:5000 project-review-api
# The container applies pending database migrations, then starts the server.

FROM node:22-slim AS build
WORKDIR /app
# Prisma needs OpenSSL, which the slim image does not ship.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
# The schema must be there first: `npm ci` runs `prisma generate` (the postinstall script).
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
# Dev dependencies stay out of the final image. `prisma` (the CLI that runs migrations) is a
# regular dependency for exactly this reason.
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

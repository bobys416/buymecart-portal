FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat curl

COPY package*.json ./
COPY packages/ packages/

RUN npm ci

COPY . .

ENV NODE_ENV=development \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["npx", "next", "dev", "-H", "0.0.0.0", "-p", "3000"]

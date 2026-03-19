# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/devprep ./artifacts/devprep
COPY lib ./lib

RUN corepack enable && \
    pnpm install --frozen-lockfile --prod false

ARG BASE_PATH=/
ENV PORT=3000
ENV BASE_PATH=$BASE_PATH

RUN pnpm --filter @workspace/devprep run build

# Production stage with nginx
FROM nginx:alpine AS production

RUN apk add --no-cache openssl

COPY artifacts/devprep/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/artifacts/devprep/dist/public /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

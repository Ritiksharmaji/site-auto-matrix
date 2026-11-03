# Runtime image only: the app is built on the developer machine by deploy/deploy.sh
# (Next.js standalone output), so the 1 GB server never runs `next build`.
FROM node:22-bookworm-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/* \
	&& npm install -g prisma@6.19.3 \
	&& npm cache clean --force

WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1

# build/app = .next-prod/standalone + static assets + public/ + prisma/ (schema + migrations)
COPY --chown=node:node build/app/ ./

USER node
EXPOSE 3000
CMD ["node", "server.js"]

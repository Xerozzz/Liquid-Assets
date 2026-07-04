FROM node:20-bookworm-slim

WORKDIR /app

# Optional: allow bypassing TLS validation for the Prisma engine download during build.
# Off by default. Set --build-arg PRISMA_INSECURE_TLS=1 only if your build host is
# behind a TLS-intercepting proxy — you should prefer NODE_EXTRA_CA_CERTS in real setups.
ARG PRISMA_INSECURE_TLS

RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --silent

# Pre-download Prisma engines during build (npm's trusted CA store is honoured here).
# If the host is behind a TLS-intercepting proxy, provide the CA via NODE_EXTRA_CA_CERTS.
COPY prisma ./prisma
RUN if [ "$PRISMA_INSECURE_TLS" = "1" ]; then \
      NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate; \
    else \
      npx prisma generate; \
    fi

COPY . .

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

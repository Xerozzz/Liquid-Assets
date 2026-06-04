FROM node:18-bullseye

WORKDIR /app

# Install system deps required by Prisma (OpenSSL)
RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl libssl1.1 ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Install Node deps
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Copy source
COPY . .

# Generate Prisma client (will run harmlessly if DATABASE_URL not set during build)
RUN npx prisma generate || true

EXPOSE 4000

CMD ["node", "src/index.js"]

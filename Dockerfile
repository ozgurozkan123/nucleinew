FROM node:20-slim

ENV NODE_ENV=production

RUN echo "=== installing base packages ==="
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN echo "=== copying package files ==="
COPY package*.json ./
RUN echo "=== npm install ==="
RUN npm install

COPY . .

RUN echo "=== npm run build ==="
RUN npm run build

ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["npm", "start"]

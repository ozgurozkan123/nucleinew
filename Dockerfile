FROM node:20-slim

ENV NODE_ENV=production

RUN echo "=== installing base packages ==="
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install nuclei binary (latest available Dec 2025)
ENV NUCLEI_VERSION=3.5.0
RUN echo "=== downloading nuclei v${NUCLEI_VERSION} ==="
RUN curl -L "https://github.com/projectdiscovery/nuclei/releases/download/v${NUCLEI_VERSION}/nuclei_${NUCLEI_VERSION}_linux_amd64.zip" -o /tmp/nuclei.zip \
    && unzip /tmp/nuclei.zip -d /tmp \
    && mv /tmp/nuclei /usr/local/bin/nuclei \
    && chmod +x /usr/local/bin/nuclei \
    && rm -rf /tmp/*

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

# HZE Games: one small Node server, no npm packages.
#   docker build -t hze-games .
#   docker run -d -p 8080:8080 -v hze-data:/data --restart unless-stopped hze-games
# Players and scores live in /data (db.json). Keep that volume: it is the whole database.
FROM node:20-alpine
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data
WORKDIR /app
COPY package.json ./
COPY server ./server
COPY game ./game
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1
CMD ["node", "server/server.js"]

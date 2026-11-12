FROM node:22.23.2-alpine

ARG APP_VERSION=0.1.0

WORKDIR /app

LABEL org.opencontainers.image.title="Expense Exchange" \
  org.opencontainers.image.version="${APP_VERSION}"

COPY --chown=node:node .dist/client/browser ./dist/client/browser
COPY --chown=node:node .dist/server-bundle ./dist/server-bundle

RUN mkdir -p /app/data && chown -R node:node /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV DIST_DIR=dist

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --output-document=/dev/null http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "dist/server-bundle/server.cjs"]

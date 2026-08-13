FROM node:22-alpine

WORKDIR /app

ARG USER_ID=1000
ARG GROUP_ID=1000

RUN apk add --no-cache shadow && \
    usermod -u ${USER_ID} node && \
    groupmod -g ${GROUP_ID} node && \
    chown -R node:node /app

COPY --chown=node:node package*.json ./

USER node

RUN npm ci --include=dev

COPY --chown=node:node . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main.js"]

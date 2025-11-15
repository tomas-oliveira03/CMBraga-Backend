FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ gcc

COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY src/ src/

RUN npm run build

EXPOSE 3001

ENV NODE_ENV=production
ENV DOCKER_BUILD=true

CMD npm run mig:run && npm run prod:server

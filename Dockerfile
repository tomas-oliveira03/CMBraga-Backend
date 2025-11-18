FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ gcc

COPY package*.json ./

RUN npm install

COPY tsconfig*.json ./
COPY src/ src/
COPY Makefile ./

RUN npm run build

COPY src/scripts/routes/ dist/scripts/routes/

EXPOSE 3001

ENV NODE_ENV=production
ENV DOCKER_BUILD=true


CMD npm run mig:run && npm run prod:hydration && npm run prod:server

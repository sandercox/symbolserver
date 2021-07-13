## Compile the SymbolPath tool
FROM alpine:latest AS build-symbolpath

RUN apk update && \
    apk add build-base && \
    apk add cmake

WORKDIR /src
COPY symbolpath/ ./
WORKDIR /build
RUN cmake /src
RUN cmake --build . --config Release

## TypeScript build react
FROM node:15-alpine AS build-react

# update packages
RUN apk update

# create root application folder
WORKDIR /app

# Setup NPM packages
COPY frontend/package*.json ./
COPY frontend/tsconfig.json ./
RUN npm install

# Copy our source and build
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm run build

## TypeScript temporary image
FROM node:15-alpine AS build

# update packages
RUN apk update

# create root application folder
WORKDIR /app

# Setup NPM packages
COPY backend/package*.json ./
COPY backend/tsconfig.json ./
RUN npm install

# Copy our source and build
COPY backend/src ./src
RUN npm run build

## Make production image
FROM node:15-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --only=production
RUN npm install pm2 -g

# Link /storage to /app/storage
RUN mkdir /storage; ln -s /storage storage

# Copy the symbol path tool
COPY --from=build-symbolpath /build/SymbolPath ./bin/SymbolPath

# Copy the TypeScript Node app
COPY --from=build /app/build ./build
COPY --from=build-react /app/build ./public
COPY backend/views /app/views

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000
CMD ["pm2-runtime", "build/index.js"]

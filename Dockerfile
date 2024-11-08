FROM node:iron-alpine3.20 AS appbuild
WORKDIR /usr/app/

COPY . .
RUN node -v
RUN npm i && npm run build

FROM node:iron-alpine3.20
WORKDIR /usr/app/

COPY package.json package-lock.json tsconfig.json ./
COPY --from=appbuild /usr/app/dist ./dist
RUN npm i --omit=dev

EXPOSE 80

ENTRYPOINT ["node", "dist/index.js"]

# Base image with Node.js v20
FROM node:20

WORKDIR /app
COPY shared/package.json ./shared/
RUN yarn --cwd shared install
COPY shared ./shared

COPY server/package.json ./server/
RUN yarn --cwd server install
COPY server ./server

COPY client/package.json ./client/
RUN yarn --cwd client install
COPY client ./client

COPY .env ./

# Build the client
RUN cd client && yarn build

ENV NODE_ENV=production
CMD ["yarn", "--cwd", "server", "start"]

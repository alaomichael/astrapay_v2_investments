ARG NODE_IMAGE=node:16.13.1-alpine

FROM $NODE_IMAGE AS base
LABEL org.opencontainers.image.source=https://github.com/alaomichael/investment_service_api
LABEL org.opencontainers.image.description="Investment Service container image"
LABEL org.opencontainers.image.licenses=MIT
RUN apk --no-cache add dumb-init
RUN mkdir -p /home/node/app && chown node:node /home/node/app
WORKDIR /home/node/app
USER node
RUN mkdir tmp

FROM base AS dependencies
COPY --chown=node:node ./package*.json ./
RUN npm ci
COPY --chown=node:node . .

FROM dependencies AS build
RUN node ace build --production

FROM base AS production
ENV NODE_ENV=production
ENV PORT=$PORT
ENV HOST=0.0.0.0
COPY --chown=node:node ./package*.json ./
RUN npm ci --production
# RUN npm i -g pm2
COPY --chown=node:node --from=build /home/node/app/build .
EXPOSE $PORT
CMD [ "dumb-init", "node", "server.js" ]
# We'll use PM2 as a process manager for our Node server
# RUN npm i -g pm2

# Copy everything to the root of the API service docker volume, and expose port to the outside world
# COPY --chown=node:node . .

# Let all incoming connections use the port below
# EXPOSE 1379
# EXPOSE $PORT

# CMD npm run pm2:start

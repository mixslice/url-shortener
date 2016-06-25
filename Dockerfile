FROM node:4.2

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app


# Install app dependencies
COPY package.json .npmrc /usr/src/app/
RUN npm install
RUN npm cache clean

# Bundle app source
COPY . /usr/src/app
RUN npm run build
EXPOSE 3000
CMD [ "npm", "run", "serve" ]

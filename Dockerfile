FROM node:4.2

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Prepare cnpm
RUN npm config set registry https://registry.npm.taobao.org
RUN npm config set disturl https://npm.taobao.org/dist
RUN npm config set @mh:registry http://npm.digitwalk.com

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install
RUN npm cache clean

# Bundle app source
COPY . /usr/src/app
RUN npm run build
EXPOSE 3000
CMD [ "npm", "run", "serve" ]

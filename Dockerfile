FROM node:4.2

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Prepare cnpm
RUN npm install -g cnpm --registry=https://registry.npm.taobao.org
RUN npm cache clean
RUN cnpm config set @mh:registry http://npm.digitwalk.com

# Install app dependencies
ONBUILD COPY package.json /usr/src/app/
ONBUILD RUN cnpm install
ONBUILD RUN npm cache clean

# Bundle app source
ONBUILD COPY . /usr/src/app
RUN npm run build
EXPOSE 3000
CMD [ "npm", "run", "serve" ]

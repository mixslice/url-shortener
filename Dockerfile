FROM registry.digitwalk.com/node-onbuild
RUN npm run build
EXPOSE 3000
CMD [ "npm", "run", "serve" ]

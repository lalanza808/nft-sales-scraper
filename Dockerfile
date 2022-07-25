FROM node:16-stretch-slim
RUN mkdir /app
COPY package.json /app
COPY package-lock.json /app
RUN cd /app && npm i 
COPY . /app
WORKDIR /app
ENTRYPOINT ["npm","run","start"]
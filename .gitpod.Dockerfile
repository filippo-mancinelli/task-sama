FROM node:16.19.0

WORKDIR /workspace

COPY package*.json ./

RUN npm install
RUN npm install truffle --global
RUN npm install ganache --global

COPY . .

CMD ["npm", "start"]

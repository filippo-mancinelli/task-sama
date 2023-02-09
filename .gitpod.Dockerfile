FROM node:16.19.0

WORKDIR /workspace

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]

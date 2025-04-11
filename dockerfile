FROM node:20-alpine

WORKDIR /user/src/app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "start"]
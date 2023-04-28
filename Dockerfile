FROM node:14-alpine

WORKDIR /app

COPY v1/package.json .

RUN npm install

COPY v1/ .

EXPOSE 5555

CMD ["npm",  "run",  "dev"]
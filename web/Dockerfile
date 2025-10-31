FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

ENV API_BASE_URL=http://api:8000

EXPOSE 3000

CMD ["sh", "-c", "npx next dev -p 3000 -H 0.0.0.0"]
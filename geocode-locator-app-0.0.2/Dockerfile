FROM node:8.11.1
WORKDIR /app
COPY . /app/
RUN npm cache clean --force && npm install
CMD node --max-old-space-size=4096 app.js
EXPOSE 8074

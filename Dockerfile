# Use an official Node.js LTS image
FROM node:16

# Create and set home directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy remaining source code
COPY . .

# Expose default port (if you're using port 3000 in server.js)
EXPOSE 3000

# Set command to run your app
CMD ["node", "server.js"] 
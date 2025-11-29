# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend .

# Set environment to production
ENV NODE_ENV=production

# Expose the port your server runs on
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
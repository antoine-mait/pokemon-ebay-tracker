FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend ./backend

# Set environment to production
ENV NODE_ENV=production

# Expose the port your server runs on
EXPOSE 3001

# Start the server
CMD ["node", "backend/server.js"]
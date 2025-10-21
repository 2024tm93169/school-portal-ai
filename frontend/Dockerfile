# Use a lightweight Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency files first (for caching)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy remaining project files
COPY public ./public
COPY src ./src

# Accept a build argument for API base (passed from docker-compose)
ARG REACT_APP_API_BASE
ENV REACT_APP_API_BASE=${REACT_APP_API_BASE}

# Ensure the React dev server listens on all interfaces
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# Disable interactive prompts in CI/CD builds
ENV CI=true

# Start the React development server
CMD ["npm", "start"]

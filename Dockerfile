# Use lightweight Node.js Alpine base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy all application files (HTML, CSS, JS, Database generator, Trie)
COPY data.js trie.js server.js ./
COPY public/ ./public/

# Expose port 3000
EXPOSE 3000

# Run the Node server
CMD ["node", "server.js"]

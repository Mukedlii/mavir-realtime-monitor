# Use Apify base image with Node.js 20
FROM apify/actor-node:20

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . ./

# Run the actor
CMD npm start

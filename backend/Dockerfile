# Specify the base image
FROM node:19

# Install MongoDB
RUN apt-get update && apt-get install -y mongodb

# Install Ganache
RUN npm install -g ganache-cli

# Install Truffle
RUN npm install -g truffle

# specify the data directory as a volume to persist data outside the container for mongodb
VOLUME ["/data/db"] 

# Clone backend code
RUN git clone https://github.com/filippo-mancinelli/task-sama.git

# Set the working directory
WORKDIR /task-sama

# Install dependencies
RUN npm install

# Expose ports
EXPOSE 27017
EXPOSE 3000

# Grant execution permission to the script
RUN chmod +x /backend/start.sh

# Start the script (backend + DB)
CMD ["./backend/start.sh"]


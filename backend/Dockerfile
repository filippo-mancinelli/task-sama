# Specify the base image
FROM node:19

# Install MongoDB
RUN apt-get install gnupg
RUN curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg \
   --dearmor
RUN echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
RUN apt-get update
RUN apt-get install -y mongodb-org

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


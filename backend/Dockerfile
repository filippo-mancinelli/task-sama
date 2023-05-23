# Specify the base image
FROM node:19

# specify the data directory as a volume to persist data outside the container for mongodb
VOLUME ["/data/db"] 

# Clone repo code
RUN git clone https://github.com/filippo-mancinelli/task-sama.git

# Set the working directory 
WORKDIR /task-sama/backend
  
# Install dependencies
RUN npm install
 
# Expose ports
EXPOSE 3000
 
# Start the backend
CMD ["node", "index.js"]  
 
 
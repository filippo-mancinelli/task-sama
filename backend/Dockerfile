# Specify the base image
FROM node:19

# Clone repo code
RUN git clone https://github.com/filippo-mancinelli/task-sama.git

# Copy configuration file
COPY .env /task-sama/

# Set the working directory 
WORKDIR /task-sama/backend
  
# Install dependencies 
RUN npm install 

# Expose ports  
EXPOSE 3000
 
# Start the backend 
CMD ["node", "index.js"] 
  
 
# Connect to MongoDB
mongosh --host <hostname> --port <port> -u <username> -p <password> --authenticationDatabase <authDB>

# Switch Database
use <database>

# Show Databases
show dbs

# Show Collections
show collections

# Create User
db.createUser({
  user: "<username>",
  pwd: "<password>",
  roles: ["readWrite"]
})

# List Users
db.getUsers()

# Insert Document
db.<collection>.insertOne({ key: "value" })

# Find Documents
db.<collection>.find()

# Update Document
db.<collection>.updateOne({ key: "value" }, { $set: { key: "new-value" } })

# Delete Document
db.<collection>.deleteOne({ key: "value" })

# Create Collection
db.createCollection("provacol")

# Drop Collection
db.<collection>.drop()

# Authenticate as User
db.auth("<username>", "<password>")

# Create New Database
use <newDatabase>

# Backup
mongodump --host <hostname> --port <port> -u <username> -p <password> --authenticationDatabase <authDB> --out <backupDir>

# Restore
mongorestore --host <hostname> --port <port> -u <username> -p <password> --authenticationDatabase <authDB> <backupDir>

# Exit MongoDB Shell
quit()

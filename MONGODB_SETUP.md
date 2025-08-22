# MongoDB Setup Guide

## Prerequisites
- MongoDB installed and running locally, or a MongoDB Atlas connection string

## Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/voice-prototype

# Server Port (optional, defaults to 3000)
PORT=3000
```

## Local MongoDB Setup
1. Install MongoDB locally
2. Start MongoDB service
3. The default connection string will work: `mongodb://localhost:27017/voice-prototype`

## MongoDB Atlas Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Replace the MONGODB_URI in your .env file

## API Endpoints

### POST /api/data
Store data in MongoDB

**Request Body:**
```json
{
    "name": "Your Name",
    "data": "Your Data Content"
}
```

**Response:**
```json
{
    "message": "Data stored successfully",
    "data": {
        "_id": "generated_id",
        "name": "Your Name",
        "data": "Your Data Content",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
    }
}
```

### GET /api/data
Retrieve all data from MongoDB

### GET /api/data/:id
Retrieve specific data by ID

## Testing with Postman
1. Set the request method to POST
2. Set the URL to: `http://localhost:3000/api/data`
3. Set the request body to raw JSON
4. Add the required fields: `name` and `data`
5. Send the request

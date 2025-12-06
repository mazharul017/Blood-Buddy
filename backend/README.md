# Blood Buddy Backend API

Backend API for Blood Buddy - A MERN stack application for connecting blood donors with recipients.

## Features

- User Authentication (Register/Login with JWT)
- Blood Request Management
- Donor Registration and Management
- Contact/Help Form
- RESTful API endpoints

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/blood-buddy
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

3. Make sure MongoDB is running on your system

4. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Blood Requests
- `POST /api/blood-requests` - Create a new blood request
- `GET /api/blood-requests` - Get all active blood requests (with optional filters)
- `GET /api/blood-requests/:id` - Get a single blood request
- `POST /api/blood-requests/:id/respond` - Respond to a blood request (protected)
- `PATCH /api/blood-requests/:id/status` - Update blood request status (protected)
- `GET /api/blood-requests/user/my-requests` - Get user's blood requests (protected)

### Donors
- `POST /api/donors/register` - Register as a donor (protected)
- `GET /api/donors` - Get all donors (with optional filters)
- `GET /api/donors/:id` - Get a single donor
- `GET /api/donors/profile/me` - Get current user's donor profile (protected)
- `PATCH /api/donors/profile/me` - Update donor profile (protected)
- `PATCH /api/donors/profile/availability` - Update donor availability (protected)

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contact messages

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

## Models

### User
- name, email, password, role, isDonor

### BloodRequest
- name, bloodGroup, location, phone, hospital, urgency, unitsNeeded, notes, status, userId, responses

### Donor
- userId, name, bloodGroup, location, phone, email, isAvailable, lastDonationDate, totalDonations

### Contact
- name, email, phone, bloodGroup, message, status


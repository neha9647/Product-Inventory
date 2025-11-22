# Full-Stack Product Inventory Management System (MERN)

A full-stack inventory management application built using the MERN stack (MongoDB, Express.js, React, Node.js).  
The system supports secure authentication and complete CRUD operations for managing product data.

## Features
- User authentication (login and registration)
- Add, view, update, and delete inventory items
- Search and filter product details
- Real-time updates on product list
- Modular backend structure

## Tech Stack
- **Frontend:** React  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Mongoose)  
- **Authentication:** JWT  
- **Tools:** Axios, Postman


## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login and return token |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | Get all products |
| POST | /api/products | Add a new product |
| GET | /api/products/:id | Get a product by ID |
| PUT | /api/products/:id | Update product information |
| DELETE | /api/products/:id | Delete a product |

## Setup and Installation

### 1. Clone the repository
```
git clone https://github.com/your-username/inventory-app.git
cd inventory-app
```

### 2. Install backend dependencies
```
cd backend
npm install
```

### 3. Install frontend dependencies
```
cd ../frontend
npm install
```

### 4. Configure environment variables
Create a `.env` file inside the backend folder:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 5. Run backend
```
cd backend
npm start
```

### 6. Run frontend
```
cd ../frontend
npm start
```

## Testing
- API tested using Postman  
- CRUD operations manually validated on the frontend  
- Database query performance improved using indexing and pagination

## Notes
This project demonstrates end-to-end development using the MERN stack, including API design, database modeling, authentication, and UI development.


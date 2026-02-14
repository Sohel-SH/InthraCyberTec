// API Configuration - Update the URL when you receive it from the developer

export const API_CONFIG = {
  // Backend API endpoint for queries
  // Options for testing:
  // 1. JSONPlaceholder (Free public API): https://jsonplaceholder.typicode.com/users
  // 2. ReqRes (Free API): https://reqres.in/api/users
  // 3. Your backend: http://localhost:8000/api/query or https://your-api.com/query
  
  // Query endpoint - returns table data
  QUERY_ENDPOINT: process.env.NEXT_PUBLIC_QUERY_API_URL || "https://jsonplaceholder.typicode.com/users",
  
  // For custom backends, you can configure different endpoints
  // QUERY_ENDPOINT: process.env.NEXT_PUBLIC_QUERY_API_URL || "http://localhost:8000/api/query",
  
  // You can add more endpoints here as needed
  // HEALTH_ENDPOINT: process.env.NEXT_PUBLIC_HEALTH_API_URL || "http://localhost:8000/api/health",
};

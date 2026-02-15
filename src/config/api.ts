// config/api.ts

/**
 * API Configuration
 * 
 * Available FREE POST APIs for testing:
 * 
 * 1. HTTPBin (Recommended for testing) - Echoes back your request
 *    - Returns everything you send in the response
 *    - Perfect for debugging POST requests
 * 
 * 2. ReqRes - Mock user creation API
 *    - Returns created resource with id and timestamp
 *    - Good for simulating real API behavior
 * 
 * 3. JSONPlaceholder - Mock REST API
 *    - Returns created post with id
 *    - Simple and reliable
 */

export const API_CONFIG = {
  // Option 1: HTTPBin (Best for testing - shows everything you sent)
  QUERY_ENDPOINT: "http://0.0.0.0:8000",
  
  // Option 2: ReqRes API (Simulates creating a user)
  // QUERY_ENDPOINT: "https://reqres.in/api/users",
  
  // Option 3: JSONPlaceholder (Simulates creating a post)
  // QUERY_ENDPOINT: "https://jsonplaceholder.typicode.com/posts",
  
  // Option 4: Your custom backend
  // QUERY_ENDPOINT: "http://localhost:3000/api/query",
  
  METHOD: "POST",
};
# Super Simple Authentication
This code creates an Express app for user authentication with JWTs. It supports registration, login, token refresh, and logout, using bcrypt for password hashing and storing users in-memory. Access tokens are refreshed with valid refresh tokens, and protected routes require authentication.

TODO: Auth by third party provider

## Usage

```sh
curl -X POST http://localhost:3000/register \
-H "Content-Type: application/json" \
-d '{
  "username": "testuser",
  "password": "testpassword"
}'
# {"message":"User registered successfully"}

curl -X POST http://localhost:3000/login \
-H "Content-Type: application/json" \
-d '{
  "username": "testuser",
  "password": "testpassword"
}'
# {"accessToken":"eyJ...", "refreshToken":"eyJ..."}

curl -X GET http://localhost:3000/protected \
-H "Authorization: Bearer ACCESS_TOKEN"
# {"message":"This is protected data", "user":{"username":"testuser","iat":1737341932,"exp":1737342832}}

curl -X POST http://localhost:3000/refresh \
-H "Content-Type: application/json" \
-d '{
  "refreshToken": "REFRESH_TOKEN"
}'
# {"accessToken":"eyJ..."}

curl -X POST http://localhost:3000/logout \
-H "Content-Type: application/json" \
-d '{
  "refreshToken": "REFRESH_TOKEN"
}'
```

## Frontend Considerations
After the user logs in and receives the access token from the backend, store it in a secure way:
- In-Memory Storage: Store the token in a variable or state (e.g., React state, Vue state, etc.).
- Secure Cookies: Store the token in an `httpOnly` and `secure` cookie (if your frontend and backend are on the same domain).

The token should not be stored in insecure locations like `localStorage` or `sessionStorage` because they are vulnerable to XSS attacks.

Im summary: 
- Store the access token in memory (e.g., React state, Vue state).
- Add the token to the Authorization header using the `Bearer` scheme.
- Handle token expiry by refreshing the token and retrying the request.
- Clear tokens from memory on logout.
- Avoid insecure storage mechanisms like localStorage or sessionStorage.

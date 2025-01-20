const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
// Parse incoming JSON payloads in requests
// otherwise req.body would be undefined
app.use(express.json());

const JWT_ACCESS_SECRET = "your-access-secret-key";   // process.env.JWT_ACCESS_SECRET
const JWT_REFRESH_SECRET = "your-refresh-secret-key"; // process.env.JWT_REFRESH_SECRET

// In-memory storage (use a database in production)
const users = [];
const refreshTokens = new Set();

// Middleware to verify access token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Invalid or expired access token" });
    }
    req.user = user;
    next();
  });
};

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (users.find((u) => u.username === username)) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Generate a hash for the given string with a salt
    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({
      username,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = jwt.sign({ username: user.username }, JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ username: user.username }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    refreshTokens.add(refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
});

// When the access token expires, the backend will return error response.
// At this point, the frontend uses the refresh token to request a new access token.
app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      refreshTokens.delete(refreshToken);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign({ username: user.username }, JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });

    res.json({ accessToken });
  });
});

app.post("/logout", (req, res) => {
  const { refreshToken } = req.body;
  refreshTokens.delete(refreshToken);
  res.json({ message: "Logged out successfully" });
});

// Protected route example
app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is protected data", user: req.user });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

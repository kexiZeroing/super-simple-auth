const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");

const JWT_ACCESS_SECRET = "your-access-secret-key";
const qrCodeSessions = new Map();

// Generate QR Code for login "/qrcode"
const generateQRCode = async (req, res) => {
  const token = jwt.sign({ temp: true }, JWT_ACCESS_SECRET, { expiresIn: "5m" });
  const url = `https://yourapp.com/qrcode/login?token=${token}`;

  qrCodeSessions.set(token, { status: "pending", user: null });

  try {
    const qrCodeImage = await qrcode.toDataURL(url);
    res.json({ qrCodeImage, token });
  } catch (error) {
    res.status(500).json({ message: "Error generating QR code" });
  }
};

// Check QR Code Status "/qrcode/status/:token"
const checkQRCodeStatus = (req, res) => {
  const { token } = req.params;
  const session = qrCodeSessions.get(token);

  if (!session) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  res.json({ status: session.status, user: session.user });
};

// Authenticate QR Code "/qrcode/login?token=:token"
const authenticateQRCode = async (req, res) => {
  const { token } = req.query;

  // Assume the user is already logged in on the mobile app
  const authHeader = req.headers["authorization"];
  const mobileAccessToken = authHeader && authHeader.split(" ")[1];

  const session = qrCodeSessions.get(token);
  if (!session) {
    return res.status(401).json({ message: "Invalid or expired QR code token" });
  }

  jwt.verify(mobileAccessToken, JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired mobile access token" });
    }

    // Link the QR code session to the authenticated user
    session.status = "authenticated";
    session.user = user.username;
    qrCodeSessions.set(token, session);

    res.json({
      message: "QR code authenticated successfully",
      user: user.username,
      accessToken: jwt.sign({ username: user.username }, JWT_ACCESS_SECRET, {
        expiresIn: "15m",
      }),
    });
  });
};

module.exports = {
  generateQRCode,
  checkQRCodeStatus,
  authenticateQRCode,
};
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: isProd ? "None" : "Lax",
  secure: isProd,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// -----------------------------
// REGISTER
// -----------------------------
async function register(req, res) {
  const { username, email, first_name, last_name, password, password_confirm } =
    req.body;

  if (
    !username ||
    !email ||
    !password ||
    !password_confirm ||
    !first_name ||
    !last_name
  ) {
    return res.status(422).json({ message: "Invalid fields" });
  }

  if (password !== password_confirm) {
    return res.status(422).json({ message: "Passwords do not match" });
  }

  const userExists = await User.exists({ email }).exec();
  if (userExists) return res.sendStatus(409);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      username,
      password: hashedPassword,
      first_name,
      last_name,
    });

    return res.sendStatus(201);
  } catch (error) {
    return res.status(400).json({ message: "Could not register" });
  }
}

// -----------------------------
// LOGIN
// -----------------------------
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ message: "Invalid fields" });
  }

  const user = await User.findOne({ email }).exec();
  if (!user) {
    return res.status(401).json({ message: "Email or password is incorrect" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Email or password is incorrect" });
  }

  // Short-lived access token (30 mins)
  const accessToken = jwt.sign(
    { id: user.id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "30m" }
  );

  // Long-lived refresh token (30 days)
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "30d" }
  );

  user.refresh_token = refreshToken;
  await user.save();

  res.cookie("refresh_token", refreshToken, cookieOptions);

  res.json({ access_token: accessToken });
}

// -----------------------------
// LOGOUT
// -----------------------------
async function logout(req, res) {
  const cookies = req.cookies;
  if (!cookies?.refresh_token) return res.sendStatus(204);

  const refreshToken = cookies.refresh_token;
  const user = await User.findOne({ refresh_token: refreshToken }).exec();

  if (user) {
    user.refresh_token = null;
    await user.save();
  }

  res.clearCookie("refresh_token", cookieOptions);
  res.sendStatus(204);
}

// -----------------------------
// REFRESH TOKEN
// -----------------------------
async function refresh(req, res) {
  const cookies = req.cookies;
  if (!cookies?.refresh_token) return res.sendStatus(401);

  const refreshToken = cookies.refresh_token;

  const user = await User.findOne({ refresh_token: refreshToken }).exec();
  if (!user) return res.sendStatus(403);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) return res.sendStatus(403);

    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    res.json({ access_token: accessToken });
  });
}

// -----------------------------
// GET CURRENT USER
// -----------------------------
async function user(req, res) {
  return res.status(200).json(req.user);
}

module.exports = {
  register,
  login,
  logout,
  refresh,
  user,
};

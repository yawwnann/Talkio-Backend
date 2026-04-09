const prisma = require("../utils/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendResponse } = require("../utils/response");

const register = async (req, res) => {
  try {
    const { email, password, role, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendResponse(res, 400, "Email already registered.");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || "PARENT", // Default role is PARENT
        name,
      },
    });

    // Remove password from response
    const { password: _, ...userData } = newUser;

    return sendResponse(res, 201, "User registered successfully", userData);
  } catch (error) {
    console.error(error); // Log for debugging
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return sendResponse(res, 400, "Invalid email or password.");
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return sendResponse(res, 400, "Invalid email or password.");
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }, // Token expires in 1 day
    );

    // Remove password from response
    const { password: _, ...userData } = user;

    return sendResponse(res, 200, "Login successful", {
      token,
      user: userData,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const logout = async (req, res) => {
  try {
    // JWT is stateless, so logout is handled client-side by removing the token
    // This endpoint is provided for API consistency
    // In production, you could add token blacklisting here if needed
    return sendResponse(res, 200, "Logout successful");
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  register,
  login,
  logout,
};

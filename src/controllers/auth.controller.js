const prisma = require("../utils/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendResponse } = require("../utils/response");

const register = async (req, res) => {
  try {
    const { email, password, role, name, recoveryPin } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendResponse(res, 400, "Email sudah terdaftar.");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Hash recovery PIN if provided
    let hashedPin = null;
    if (recoveryPin) {
      hashedPin = await bcrypt.hash(recoveryPin, salt);
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        recoveryPin: hashedPin,
        role: role || "PARENT",
        name,
      },
    });

    // Remove password & recoveryPin from response
    const { password: _, recoveryPin: __, ...userData } = newUser;

    return sendResponse(res, 201, "User registered successfully", userData);
  } catch (error) {
    console.error(error);
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

const forgotPassword = async (req, res) => {
  try {
    const { email, recoveryPin } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return sendResponse(res, 404, "Email tidak ditemukan.");
    }

    // If only email provided (step 1), just confirm email exists
    if (!recoveryPin) {
      return sendResponse(res, 200, "Email ditemukan.", {
        email: user.email,
        name: user.name,
      });
    }

    // Check if user has recovery PIN
    if (!user.recoveryPin) {
      const adminWa = process.env.ADMIN_WHATSAPP || "6281234567890";
      return sendResponse(res, 400, `Anda belum memiliki PIN pemulihan. Hubungi admin via WhatsApp di ${adminWa} untuk bantuan.`, {
        adminWhatsApp: adminWa,
      });
    }

    // Verify recovery PIN
    const validPin = await bcrypt.compare(recoveryPin, user.recoveryPin);
    if (!validPin) {
      const adminWa = process.env.ADMIN_WHATSAPP || "6281234567890";
      return sendResponse(res, 400, `PIN salah. Hubungi admin via WhatsApp di ${adminWa} untuk bantuan.`, {
        adminWhatsApp: adminWa,
      });
    }

    // Generate short-lived token for password reset (5 minutes)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, purpose: "reset_password" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" },
    );

    return sendResponse(res, 200, "PIN benar. Silakan reset password.", {
      resetToken,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Terjadi kesalahan server.");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.purpose !== "reset_password") {
        return sendResponse(res, 400, "Token tidak valid.");
      }
    } catch (err) {
      return sendResponse(res, 400, "Token sudah kadaluarsa. Silakan ulangi proses lupa password.");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword },
    });

    return sendResponse(res, 200, "Password berhasil direset. Silakan login.");
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Terjadi kesalahan server.");
  }
};

const setRecoveryPin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPin, oldPin } = req.body;

    if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      return sendResponse(res, 400, "PIN harus 6 digit angka.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { recoveryPin: true },
    });

    if (!user) {
      return sendResponse(res, 404, "User tidak ditemukan.");
    }

    // If user already has a PIN, verify old PIN first
    if (user.recoveryPin) {
      if (!oldPin) {
        return sendResponse(res, 400, "PIN lama harus diisi.");
      }
      const valid = await bcrypt.compare(oldPin, user.recoveryPin);
      if (!valid) {
        return sendResponse(res, 400, "PIN lama salah.");
      }
    }

    // Hash and save new PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { recoveryPin: hashedPin },
    });

    const message = user.recoveryPin ? "PIN pemulihan berhasil diubah." : "PIN pemulihan berhasil diaktifkan.";
    return sendResponse(res, 200, message);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Terjadi kesalahan server.");
  }
};

const logout = async (req, res) => {
  try {
    return sendResponse(res, 200, "Logout successful");
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return sendResponse(res, 400, "Old password and new password are required.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return sendResponse(res, 404, "User not found.");
    }

    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return sendResponse(res, 400, "Password lama salah.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return sendResponse(res, 200, "Password berhasil diubah.");
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Terjadi kesalahan server.");
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  setRecoveryPin,
  logout,
  changePassword,
};

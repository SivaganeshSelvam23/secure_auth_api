import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// Register user controller
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Required Field Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password is required.",
      });
    }

    // 2. Datatype Validation
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password type must be string.",
      });
    }

    // 3. Normalise Input
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Reject Empty Value After Trimming
    if (!normalizedName || !normalizedEmail || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password can't be empty.",
      });
    }

    // 5. Name Length Validation
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters.",
      });
    }

    // 6. Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex validation pattern
    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // 7. Password-length validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    // 8. Check whether email already exists
    const existingUserResult = await pool.query(
      `
      SELECT id 
      FROM users
      WHERE email = $1
      `,
      [normalizedEmail],
    );
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // 9. Insert user
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const newUserResult = await pool.query(
      `
    INSERT INTO users (
      name,
      email,
      password_hash
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      name,
      email,
      role,
      is_active,
      created_at
    `,
      [normalizedName, normalizedEmail, passwordHash],
    );

    const newUser = newUserResult.rows[0];

    // 10. Return 201
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: newUser,
    });
  } catch (error) {
    // 11. Handle unique violation
    if (error.code === "23505" && error.constraint === "users_email_key") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration failed:", error);
    // 12. Handle unexpected failure
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Login user controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // 2. Data types
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email and password must be strings.",
      });
    }

    // 3. Normalise email
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Reject empty strings
    if (!normalizedEmail || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email and password cannot be empty.",
      });
    }

    // 5. Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // 6. Find user
    const userResult = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          password_hash,
          role,
          is_active,
          created_at
        FROM users
        WHERE email = $1
      `,
      [normalizedEmail],
    );

    // 7. Reject unknown email
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = userResult.rows[0];

    // 8. Check account status
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled.",
      });
    }

    // 9. Compare entered password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    // 10. Reject incorrect password
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      },
    );

    // 11. Success response
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

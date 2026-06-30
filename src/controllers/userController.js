import pool from "../config/db.js";

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userResult = await pool.query(
      `
        SELECT
            id,
            name,
            email,
            role,
            is_active,
            created_at,
            updated_at
        FROM users
        WHERE id = $1

    `,
      [userId],
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
    const user = userResult.rows[0];
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled.",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile retrieval failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email } = req.body;

    const allowedFields = ["name", "email"];
    const receivedFields = Object.keys(req.body);

    const invalidFields = receivedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `These fields cannot be updated: ${invalidFields.join(", ")}.`,
      });
    }

    const hasName = name !== undefined;
    const hasEmail = email !== undefined;

    if (!hasName && !hasEmail) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    let normalizedName;
    let normalizedEmail;

    if (hasName) {
      if (typeof name !== "string") {
        return res.status(400).json({
          success: false,
          message: "Name must be a string.",
        });
      }
      normalizedName = name.trim();

      if (normalizedName.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Name can't be empty.",
        });
      }

      if (normalizedName.length < 2 || normalizedName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name must contain between 2 and 100 characters.",
        });
      }
    }

    if (hasEmail) {
      if (typeof email !== "string") {
        return res.status(400).json({
          success: false,
          message: "Email must be string.",
        });
      }

      normalizedEmail = email.trim().toLowerCase();

      if (normalizedEmail.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Email can't be empty.",
        });
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid email address.",
        });
      }
    }

    const updates = [];
    const values = [];
    let parameterIndex = 1;

    if (hasName) {
      updates.push(`name = $${parameterIndex}`);
      values.push(normalizedName);
      parameterIndex++;
    }

    if (hasEmail) {
      updates.push(`email = $${parameterIndex}`);
      values.push(normalizedEmail);
      parameterIndex++;
    }

    const setClause = updates.join(", ");
    console.log("setClause:::", setClause);
    values.push(userId);

    const updatedUserResult = await pool.query(
      `
        UPDATE users
        SET
          ${setClause},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $${parameterIndex}
        RETURNING
          id,
          name,
          email,
          role,
          is_active,
          created_at,
          updated_at
      `,
      values,
    );

    if (updatedUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUserResult.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email is already in use.",
      });
    }
    console.log("Failed to update profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

import pool from "../config/db.js";

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
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
        ORDER BY id ASC
      `,
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { isActive } = req.body;

    // 1. Validate user ID
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A vaild user ID is required.",
      });
    }

    // 2. Validate request body
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value.",
      });
    }
    // 3. Update user status
    const updatedUserResult = await pool.query(
      `
        UPDATE users
        SET
          is_active = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING
          id,
          name,
          email,
          role,
          is_active,
          created_at,
          updated_at
      `,
      [isActive, userId],
    );

    // 4. Handling missing user
    if (updatedUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
    const updatedUser = updatedUserResult.rows[0];
    // 5. Return updated user
    return res.status(200).json({
      success: true,
      message: `User account ${updatedUser.is_active ? "enabled" : "disabled"} successfully.`,
      user: updatedUser,
    });
  } catch (error) {
    console.log("Failed t update user status", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

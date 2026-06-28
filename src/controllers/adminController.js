import pool from "../config/db.js";

export const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    if (!Number.isInteger(page) || page <= 0) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer.",
      });
    }
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be an integer between 1 and 100.",
      });
    }
    const offset = (page - 1) * limit;
    const usersResult = await pool.query(
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
        LIMIT $1
        OFFSET $2
      `,
      [limit, offset],
    );
    const countResult = await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM users
      `,
    );
    const totalUsers = countResult.rows[0].total;
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      users: usersResult.rows,
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

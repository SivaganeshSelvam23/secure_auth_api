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

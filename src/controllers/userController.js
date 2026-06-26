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

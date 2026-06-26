const { Router } = require("express");
const db = require("../db");

const router = Router();


router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        cluster_id,
        label,
        article_count,
        earliest_at,
        latest_at,
        created_at
      FROM clusters
      ORDER BY latest_at DESC
      `
    );

    res.json({ clusters: result.rows });
  } catch (err) {
    console.error("GET /clusters error:", err);
    res.status(500).json({ error: "Failed to fetch clusters" });
  }
});

// GET /clusters/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const clusterResult = await db.query(
      `
      SELECT *
      FROM clusters
      WHERE cluster_id = $1
      `,
      [id]
    );

    if (clusterResult.rows.length === 0) {
      return res.status(404).json({
        error: `Cluster '${id}' not found`,
      });
    }

    const articlesResult = await db.query(
      `
      SELECT
        id,
        source,
        url,
        headline,
        summary,
        published_at
      FROM articles
      WHERE cluster_id = $1
      ORDER BY published_at ASC
      `,
      [id]
    );

    res.json({
      ...clusterResult.rows[0],
      articles: articlesResult.rows,
    });
  } catch (err) {
    console.error("GET /clusters/:id error:", err);
    res.status(500).json({
      error: "Failed to fetch cluster detail",
    });
  }
});

module.exports = router;
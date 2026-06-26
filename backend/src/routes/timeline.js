const { Router } = require("express");
const db = require("../db");

const router = Router();

function computeSize(articleCount) {
  if (articleCount >= 20) return 5;
  if (articleCount >= 10) return 4;
  if (articleCount >= 6) return 3;
  if (articleCount >= 3) return 2;
  return 1;
}

router.get("/", async (req, res) => {
  try {
    const { source } = req.query;

    let result;

    if (source) {
      result = await db.query(
        `
        SELECT DISTINCT
            c.cluster_id,
            c.label,
            c.article_count,
            c.earliest_at,
            c.latest_at
        FROM clusters c
        JOIN articles a
          ON a.cluster_id = c.cluster_id
        WHERE a.source = $1
        ORDER BY c.latest_at DESC
        `,
        [source]
      );
    } else {
      result = await db.query(
        `
        SELECT
            cluster_id,
            label,
            article_count,
            earliest_at,
            latest_at
        FROM clusters
        ORDER BY latest_at DESC
        `
      );
    }

    const timeline = result.rows.map((c) => ({
      cluster_id: c.cluster_id,
      label: c.label,
      article_count: c.article_count,
      earliest_at: c.earliest_at,
      latest_at: c.latest_at,
      start_ms: c.earliest_at ? new Date(c.earliest_at).getTime() : null,
      end_ms: c.latest_at ? new Date(c.latest_at).getTime() : null,
      size: computeSize(c.article_count),
    }));

    res.json({ timeline });
  } catch (err) {
    console.error("GET /timeline error:", err);
    res.status(500).json({
      error: "Failed to build timeline",
    });
  }
});

module.exports = router;
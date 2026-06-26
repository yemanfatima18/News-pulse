
import logging
import sys

from db import init_db, upsert_articles, save_clusters, get_conn
from fetcher import fetch_all_feeds
from grouper import group_articles

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)

log = logging.getLogger(__name__)


def load_all_articles_from_db() -> list:
    """Load all articles from PostgreSQL."""

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            source,
            url,
            headline,
            summary,
            body_text,
            published_at
        FROM articles
    """)

    columns = [desc[0] for desc in cur.description]
    rows = cur.fetchall()

    cur.close()
    conn.close()

    return [dict(zip(columns, row)) for row in rows]


def run():
    log.info("=== News Pulse pipeline starting ===")

    init_db()
    

    fresh_articles = fetch_all_feeds()

    if not fresh_articles:
        log.warning("No articles fetched.")
        sys.exit(1)


    upsert_articles(fresh_articles)


    all_articles = load_all_articles_from_db()

    log.info("Total articles in DB: %d", len(all_articles))


    clusters = group_articles(all_articles)

    if not clusters:
        log.warning("No clusters created.")
        sys.exit(1)


    save_clusters(clusters)

    log.info(
        "=== Pipeline complete: %d clusters from %d articles ===",
        len(clusters),
        len(all_articles),
    )


if __name__ == "__main__":
    run()
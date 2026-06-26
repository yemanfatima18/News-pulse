"""
db.py — PostgreSQL wrapper for persisting articles and clusters.

Uses Neon PostgreSQL via psycopg2.
Set the DATABASE_URL environment variable before running.
"""

import os
import logging
import psycopg2
from psycopg2.extras import execute_batch

log = logging.getLogger(__name__)


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def init_db():
    """Create tables if they don't exist yet."""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            headline TEXT,
            summary TEXT,
            body_text TEXT,
            published_at TEXT,
            cluster_id TEXT,
            fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS clusters (
            cluster_id TEXT PRIMARY KEY,
            label TEXT,
            article_count INTEGER,
            earliest_at TEXT,
            latest_at TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_articles_cluster
        ON articles(cluster_id);
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_articles_published
        ON articles(published_at);
    """)

    conn.commit()
    cur.close()
    conn.close()

    log.info("Database initialized successfully.")


def upsert_articles(articles: list):
    """
    Insert new articles.
    Skip duplicates based on URL.
    """

    if not articles:
        return

    conn = get_conn()
    cur = conn.cursor()

    query = """
        INSERT INTO articles
        (id, source, url, headline, summary, body_text, published_at)
        VALUES
        (%(id)s, %(source)s, %(url)s, %(headline)s,
         %(summary)s, %(body_text)s, %(published_at)s)
        ON CONFLICT (url) DO NOTHING;
    """

    execute_batch(cur, query, articles)

    conn.commit()
    cur.close()
    conn.close()

    log.info("Upserted %d articles", len(articles))


def save_clusters(clusters: list):
    """
    Save cluster information and assign articles.
    """

    conn = get_conn()
    cur = conn.cursor()

    # Remove previous clusters
    cur.execute("DELETE FROM clusters;")
    cur.execute("UPDATE articles SET cluster_id = NULL;")

    for cluster in clusters:

        cur.execute(
            """
            INSERT INTO clusters
            (cluster_id, label, article_count, earliest_at, latest_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (cluster_id)
            DO UPDATE SET
                label = EXCLUDED.label,
                article_count = EXCLUDED.article_count,
                earliest_at = EXCLUDED.earliest_at,
                latest_at = EXCLUDED.latest_at;
            """,
            (
                cluster["cluster_id"],
                cluster["label"],
                cluster["article_count"],
                cluster["earliest_at"],
                cluster["latest_at"],
            ),
        )

        for article in cluster["articles"]:
            cur.execute(
                """
                UPDATE articles
                SET cluster_id = %s
                WHERE id = %s;
                """,
                (
                    cluster["cluster_id"],
                    article["id"],
                ),
            )

    conn.commit()
    cur.close()
    conn.close()

    log.info("Saved %d clusters", len(clusters))
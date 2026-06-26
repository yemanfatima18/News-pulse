
import feedparser
import requests
import hashlib
import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from bs4 import BeautifulSoup
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)


RSS_FEEDS = [
    {"source": "BBC News",     "url": "http://feeds.bbci.co.uk/news/rss.xml"},
    {"source": "NPR",          "url": "https://feeds.npr.org/1001/rss.xml"},
    {"source": "The Guardian", "url": "https://www.theguardian.com/world/rss"},
]

ARTICLE_FETCH_TIMEOUT = 10


def _make_article_id(url: str) -> str:
    """
    Stable, unique ID based on the article URL.
    Using a hash means re-runs won't produce duplicate rows.
    """
    return hashlib.sha1(url.encode()).hexdigest()[:16]


def _parse_date(entry) -> Optional[datetime]:
    """
    RSS dates are a mess — different feeds use different fields and formats.
    Try the most common ones in order and fall back gracefully.
    """
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        except Exception:
            pass

    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        try:
            return datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
        except Exception:
            pass

    raw = getattr(entry, "published", None) or getattr(entry, "updated", None)
    if raw:
        try:
            return parsedate_to_datetime(raw).astimezone(timezone.utc)
        except Exception:
            pass

    return None


def _get_summary(entry) -> str:
    """
    RSS feeds are inconsistent about where the summary lives.
    content:encoded is richer but not always present.
    """
    if hasattr(entry, "content") and entry.content:
        return entry.content[0].get("value", "")
    return getattr(entry, "summary", "") or getattr(entry, "description", "") or ""


def _fetch_full_text(url: str) -> Optional[str]:
    """
    Try to pull the actual article body from the page.
    Returns None (rather than crashing) if anything goes wrong.
    """
    try:
        headers = {"User-Agent": "NewsPulse/1.0 (academic project)"}
        resp = requests.get(url, timeout=ARTICLE_FETCH_TIMEOUT, headers=headers)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "aside", "header"]):
            tag.decompose()

        for selector in ["article", "[role='main']", ".article-body", ".story-body", "main"]:
            container = soup.select_one(selector)
            if container:
                text = container.get_text(separator=" ", strip=True)
                if len(text) > 200:
                    return text[:5000]

        paragraphs = soup.find_all("p")
        text = " ".join(p.get_text(strip=True) for p in paragraphs)
        return text[:5000] if len(text) > 200 else None

    except Exception as exc:
        log.warning("Could not fetch full text for %s: %s", url, exc)
        return None


def fetch_all_feeds() -> list:
    """
    Pull articles from every configured RSS feed.
    Returns a flat list of normalized article dicts.
    """
    all_articles = []

    for feed_config in RSS_FEEDS:
        source = feed_config["source"]
        url = feed_config["url"]
        log.info("Fetching feed: %s", source)

        try:
            feed = feedparser.parse(url)
        except Exception as exc:
            log.error("Failed to parse feed %s: %s", source, exc)
            continue

        for entry in feed.entries:
            article_url = getattr(entry, "link", None)
            if not article_url:
                continue

            headline = getattr(entry, "title", "").strip()
            summary = BeautifulSoup(_get_summary(entry), "html.parser").get_text(
                separator=" ", strip=True
            )
            published_at = _parse_date(entry)

            log.info("  Fetching article text: %s", headline[:60])
            body_text = _fetch_full_text(article_url)

            article = {
                "id": _make_article_id(article_url),
                "source": source,
                "url": article_url,
                "headline": headline,
                "summary": summary,
                "body_text": body_text or summary,
                "published_at": published_at.isoformat() if published_at else None,
            }
            all_articles.append(article)

    log.info("Fetched %d articles total across all feeds", len(all_articles))
    return all_articles


import logging
import re
import uuid
from collections import defaultdict
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

log = logging.getLogger(__name__)


STOP_WORDS = "english"


SIMILARITY_THRESHOLD = 0.15


TOP_TERMS_FOR_LABEL = 4


def _clean_text(text: str) -> str:
    """Strip URLs, punctuation noise, and extra whitespace."""
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip().lower()


def _build_cluster_label(articles: list, vectorizer: TfidfVectorizer, tfidf_matrix) -> str:
    """
    Generate a human-readable label for a cluster by finding the terms
    with the highest average TF-IDF score across all articles in the cluster.
    """
    
    centroid = np.mean(tfidf_matrix, axis=0)
    centroid = np.asarray(centroid).flatten()

    terms = vectorizer.get_feature_names_out()
    top_indices = centroid.argsort()[-TOP_TERMS_FOR_LABEL:][::-1]
    top_terms = [terms[i] for i in top_indices if centroid[i] > 0]

    return " · ".join(top_terms) if top_terms else "Miscellaneous"


def group_articles(articles: list) -> list:
    """
    Cluster articles by topic and return a list of cluster dicts, each with:
      - cluster_id
      - label
      - articles (list)
      - earliest_at / latest_at timestamps
    """
    if not articles:
        return []


    corpus = []
    for a in articles:
        combined = f"{a['headline']} {a['summary']}"
        corpus.append(_clean_text(combined))

    vectorizer = TfidfVectorizer(stop_words=STOP_WORDS, min_df=1, max_df=0.9)
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
    except ValueError as exc:
        log.error("TF-IDF failed (probably empty corpus): %s", exc)
        return []

    sim_matrix = cosine_similarity(tfidf_matrix)


    n = len(articles)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        px, py = find(x), find(y)
        if px != py:
            parent[px] = py

    for i in range(n):
        for j in range(i + 1, n):
            if sim_matrix[i][j] >= SIMILARITY_THRESHOLD:
                union(i, j)


    groups = defaultdict(list)
    for i, article in enumerate(articles):
        groups[find(i)].append((i, article))

    clusters = []
    for root, members in groups.items():
        indices = [i for i, _ in members]
        member_articles = [a for _, a in members]


        cluster_matrix = tfidf_matrix[indices]
        label = _build_cluster_label(member_articles, vectorizer, cluster_matrix)


        timestamps = [
            a["published_at"] for a in member_articles if a.get("published_at")
        ]
        timestamps.sort()

        clusters.append({
            "cluster_id": str(uuid.uuid4()),
            "label": label,
            "article_count": len(member_articles),
            "earliest_at": timestamps[0] if timestamps else None,
            "latest_at": timestamps[-1] if timestamps else None,
            "articles": member_articles,
        })


    clusters.sort(key=lambda c: c["latest_at"] or "", reverse=True)

    log.info(
        "Grouped %d articles into %d clusters (threshold=%.2f)",
        n, len(clusters), SIMILARITY_THRESHOLD,
    )
    return clusters

# 📰 News Pulse – Topic-Clustered News Timeline

News Pulse is a full-stack application that collects live news articles from multiple RSS feeds, automatically groups related stories into topic clusters, and displays them on an interactive timeline.

Instead of showing hundreds of individual articles, the application organizes similar news into meaningful clusters, making it easier to follow ongoing events from different news sources.

---

# 🚀 Features

* Fetches live news from multiple RSS feeds
* Automatically groups similar articles into topic clusters
* Interactive timeline to explore news chronologically
* View all articles belonging to the same topic
* REST API for clusters, timeline, and ingestion
* Simple SQLite database for local development

---

# 🏗️ Project Architecture

```text
┌─────────────────┐      SQLite DB       ┌──────────────────┐      HTTP      ┌──────────────┐
│ Python Scraper  │ ───────────────────► │ Node.js Backend  │ ◄────────────► │ Next.js UI   │
│    /scraper     │   news_pulse.db      │    /backend      │                │  /frontend   │
└─────────────────┘                      └──────────────────┘                └──────────────┘

RSS Sources
• BBC News
• NPR
• The Guardian
```

The Python scraper fetches and processes articles before storing them in a local SQLite database. The Node.js backend reads this data and provides REST APIs, while the Next.js frontend displays the clustered news timeline.

---

# 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Data Processing

* Python
* BeautifulSoup
* Scikit-learn
* TF-IDF
* Cosine Similarity

### Database

* SQLite

---

# ⚙️ Running the Project

## 1. Start the Python Scraper

```bash
cd scraper
pip install -r requirements.txt

python main.py
```

The first run may take a few minutes because the scraper downloads the full content of each article. Future runs are much faster since duplicate articles are skipped.

---

## 2. Start the Backend

```bash
cd backend

npm install

cp .env.example .env

npm run dev
```

Backend runs on:

```
http://localhost:4000
```

### Available APIs

| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| GET    | /clusters             | Get all topic clusters |
| GET    | /clusters/:id         | Get cluster details    |
| GET    | /timeline             | Timeline data          |
| POST   | /ingest/trigger       | Run scraper manually   |
| GET    | /ingest/status/:jobId | Check scraper status   |
| GET    | /health               | Health check           |

---

## 3. Start the Frontend

```bash
cd frontend

npm install

cp .env.local.example .env.local

npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

# 🧠 How Topic Clustering Works

This project uses **TF-IDF (Term Frequency–Inverse Document Frequency)** together with **Cosine Similarity** to identify articles discussing the same topic.

### Steps

1. Fetch articles from RSS feeds.
2. Combine each article's title and summary.
3. Convert the text into TF-IDF vectors.
4. Calculate cosine similarity between articles.
5. Articles with similarity **0.15 or higher** are grouped into the same cluster using the Union-Find algorithm.
6. Generate a cluster title using the most important TF-IDF keywords.

---

# Why TF-IDF?

Compared to simple keyword matching, TF-IDF gives more importance to unique and meaningful words while reducing the impact of common words like:

* government
* people
* said

This results in cleaner and more accurate topic clusters.

---

# Threshold Selection

After testing around 50 articles:

* **0.10** → Too many unrelated stories merged together
* **0.20** → Similar stories were split into different groups
* **0.15** → Best balance between accuracy and clustering

---

# 📰 News Sources

* BBC News
* NPR
* The Guardian

---

# 💡 Design Decisions

### SQLite

SQLite was chosen because it's lightweight, requires no setup, and is perfect for local development. The project can easily be migrated to PostgreSQL by updating the database connection.

### Re-clustering

Instead of clustering only newly fetched articles, the application re-clusters all stored articles during every run. This keeps ongoing stories grouped together as new updates arrive.

### Article Extraction

The scraper first tries to extract the full article content using BeautifulSoup. If extraction fails, it automatically falls back to the RSS summary so the pipeline continues without errors.

---

# ⚠️ Known Limitation

The application does not perform true cross-source deduplication.

For example, BBC and NPR may publish different articles about the same event. These articles remain separate but are grouped into the same topic cluster if they are similar enough.

---

# 📂 Project Structure

```text
news-pulse/
│
├── scraper/
├── backend/
├── frontend/
├── news_pulse.db
└── README.md
```

---

# 📌 Future Improvements

* PostgreSQL support
* Better cross-source duplicate detection
* More RSS news sources
* Smarter cluster naming
* Search and filtering
* Real-time automatic updates

---

# 👩‍💻 Author

**Yeman Fatima**

Built as a full-stack assignment demonstrating news aggregation, text clustering, REST API development, and interactive data visualization.

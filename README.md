# brain_shelf

**brain_shelf** is a minimalist, high-utility academic research tool designed for students and researchers. It solves the "fragmented research" problem by aggregating academic books from Open Library and detailed article summaries from Wikipedia into a single, searchable interface. This eliminates the need to jump between multiple tabs and search engines, providing genuine value for academic deep-dives.

## What it does

You type a topic, and brain_shelf pulls results from two sources at once:
- **Open Library** for books and textbooks
- **Wikipedia** for article summaries and background reading

You can filter results by type, sort books by publication year, and save anything to a reading list that sticks around between sessions.

## How to run it locally

No installation needed. It's just HTML, CSS, and JavaScript.

1. Clone the repo:
   ```bash
   git clone https://github.com/iaxcel-ai/brain_shelf.git
   cd brain_shelf
   ```
2. Open `index.html` in your browser. That's it.

   On Linux you can do:
   ```bash
   xdg-open index.html
   ```
   Or just double-click the file on any OS.

3. Type a search term and hit Enter or click Search.

## APIs used

**Open Library Search API**
- Docs: https://openlibrary.org/dev/docs/api/search
- No API key required
- Returns book titles, authors, publication years, subjects, and cover images
- We request a maximum of 12 results per search to keep things fast

**Wikipedia MediaWiki API**
- Docs: https://www.mediawiki.org/wiki/API:Search
- No API key required
- Returns article titles and text snippets matching the search query
- We request up to 8 results per search

Both APIs are free and open. No authentication or signup needed.

## Features

- **Dual-source search**: fetches from Open Library and Wikipedia in parallel using `Promise.allSettled` — one API failing won't break the other
- **Surprise Me**: one-click random topic search from a curated list of subjects
- **Filter by type**: show all results, books only, or Wikipedia only
- **Sort books**: by relevance, newest first, or oldest first
- **Reading list**: save items and they persist in localStorage across browser sessions; sort saved items by title (A–Z or Z–A)
- **Copy & share**: copy a result link to clipboard or trigger the native share dialog
- **Dark mode**: toggle between light and dark themes, preference saved to localStorage
- **Error handling**: network failures, empty results, and API errors all show clear messages; Wikipedia requests include an 8-second abort timeout
- **Responsive design**: works on mobile and desktop

## Deployment to web servers

### Prerequisites
- Two web servers (web-01, web-02) with Nginx installed
- One load balancer server (lb-01) with Nginx (or HAProxy)
- SSH access to all three

### Step 1: Upload files to both web servers

From your local machine, copy the project files to each server:

```bash
# Copy to web-01
scp -r index.html style.css app.js ubuntu@web-01:/var/www/html/brain_shelf/

# Copy to web-02
scp -r index.html style.css app.js ubuntu@web-02:/var/www/html/brain_shelf/
```

If the directory doesn't exist, SSH in and create it first:
```bash
ssh web-01
sudo mkdir -p /var/www/html/brain_shelf
sudo chown ubuntu:ubuntu /var/www/html/brain_shelf
```

### Step 2: Configure Nginx on both web servers

On each web server (web-01 and web-02), edit the Nginx config:

```bash
sudo nano /etc/nginx/sites-available/default
```

Add or update the server block:

```nginx
server {
    listen 80;
    server_name _;

    # Custom header to identify which server handled the request
    add_header X-Served-By $hostname;

    root /var/www/html/brain_shelf;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Test and restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 3: Configure the load balancer (lb-01)

lb-01 uses **HAProxy** (not Nginx). SSH in and edit the HAProxy config:

```bash
ssh lb-01
sudo nano /etc/haproxy/haproxy.cfg
```

Add or update the frontend and backend blocks:

```
frontend http-in
    bind *:80
    default_backend web_servers

backend web_servers
    balance roundrobin
    server web-01 web-01_IP:80 check
    server web-02 web-02_IP:80 check
```

Replace `web-01_IP` and `web-02_IP` with the actual IP addresses of your web servers.

Validate and restart HAProxy:
```bash
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
sudo systemctl restart haproxy
```

### Step 4: Verify

Check that both servers respond directly:
```bash
curl -sI http://web-01_IP | grep -i X-Served-By
curl -sI http://web-02_IP | grep -i X-Served-By
```

Check load balancing (run multiple times — the hostname should alternate):
```bash
for i in 1 2 3 4; do curl -sI http://lb-01_IP | grep -i x-served-by; done
```

You should see `web-01` and `web-02` alternating, confirming round-robin is working.

## Project structure

```
brain_shelf/
├── index.html      # Main page with search bar, filters, and results container
├── style.css       # All styling (warm editorial theme, responsive)
├── app.js          # All logic: API calls, filtering, sorting, reading list
├── .gitignore      # Excludes OS files, editor configs, env files
└── README.md       # This file
```

## Challenges and how I dealt with them

**CORS with Wikipedia**: The Wikipedia API blocks browser requests by default. Adding `origin=*` to the query parameters fixes this. It took some digging through the MediaWiki docs to find.

**HTML in Wikipedia snippets**: Wikipedia returns search results with HTML tags embedded in the text (like `<span class="searchmatch">`). I used a regex `.replace(/<[^>]+>/g, '')` to strip those out before displaying.

**Keeping results in sync with filters**: Instead of re-fetching from the APIs every time the user changes a filter, I store all results in a global array (`allResults`) and just re-render from that. Faster and avoids hitting rate limits.

**API Failure Resilience**: I initially used `Promise.all` for fetching, but found that if one API failed (like Open Library having CORS issues in some local environments), the whole search would fail. I fixed this by using `Promise.allSettled`, which allows the app to display whatever data is available even if one source is down.

**Reading list persistence**: localStorage can throw errors in some browsers (private mode, storage full). Wrapped the load/save calls in try-catch blocks so the app still works even if storage fails.

## Credits

- [Open Library](https://openlibrary.org/) — book data and cover images. Run by the Internet Archive.
- [Wikipedia / MediaWiki API](https://www.mediawiki.org/wiki/API:Main_page) — article search and summaries. Run by the Wikimedia Foundation.
- [Lucide Icons](https://lucide.dev/) — open-source icon set used throughout the UI.
- [Google Fonts](https://fonts.google.com/) — Inter and Outfit typefaces.

## Author

Axcel Ishimwe — African Leadership University, Kigali, Rwanda
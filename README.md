# brain_shelf

A web app that lets you search for books and Wikipedia articles in one place. Built for students who want to find study resources without jumping between tabs.

## What it does

You type a topic, and StudyHub pulls results from two sources at once:
- **Open Library** for books and textbooks
- **Wikipedia** for article summaries and background reading

You can filter results by type, sort books by publication year, and save anything to a reading list that sticks around between sessions.

## How to run it locally

No installation needed. It's just HTML, CSS, and JavaScript.

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/studyhub.git
   cd studyhub
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

- **Dual-source search**: fetches from Open Library and Wikipedia at the same time using `Promise.all`
- **Filter by type**: show all results, books only, or Wikipedia only
- **Sort books**: by relevance, newest first, or oldest first
- **Reading list**: save items and they persist in localStorage across browser sessions
- **Error handling**: network failures, empty results, and API errors all show clear messages to the user
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
scp -r index.html style.css app.js ubuntu@web-01:/var/www/html/studyhub/

# Copy to web-02
scp -r index.html style.css app.js ubuntu@web-02:/var/www/html/studyhub/
```

If the directory doesn't exist, SSH in and create it first:
```bash
ssh web-01
sudo mkdir -p /var/www/html/studyhub
sudo chown ubuntu:ubuntu /var/www/html/studyhub
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

    root /var/www/html/studyhub;
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

SSH into lb-01 and edit the Nginx config:

```bash
ssh lb-01
sudo nano /etc/nginx/sites-available/default
```

Set up load balancing between the two web servers:

```nginx
upstream studyhub_backend {
    server web-01_IP;
    server web-02_IP;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://studyhub_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Replace `web-01_IP` and `web-02_IP` with the actual private IP addresses of your servers.

Test and restart:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Verify

Check that both servers respond:
```bash
curl -sI http://web-01_IP | grep X-Served-By
curl -sI http://web-02_IP | grep X-Served-By
```

Check load balancing:
```bash
curl -sI http://lb-01_IP | grep X-Served-By
curl -sI http://lb-01_IP | grep X-Served-By
```

You should see the hostname alternating between the two web servers.

## Project structure

```
studyhub/
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

**Reading list persistence**: localStorage can throw errors in some browsers (private mode, storage full). Wrapped the load/save calls in try-catch blocks so the app still works even if storage fails.

## Credits

- [Open Library](https://openlibrary.org/) — book data and cover images. Run by the Internet Archive.
- [Wikipedia / MediaWiki API](https://www.mediawiki.org/wiki/API:Main_page) — article search and summaries. Run by the Wikimedia Foundation.
- [Google Fonts](https://fonts.google.com/) — DM Serif Display and DM Sans typefaces.

## Author

Axcel Ishimwe — African Leadership University, Kigali, Rwanda

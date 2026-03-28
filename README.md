# brain_shelf

A web app that lets you search for books and Wikipedia articles in one place. Built for students who want to find academic or general knowledge quickly.

![brain_shelf preview](https://via.placeholder.com/1200x600?text=brain_shelf+Premium+Interface)

## ✨ New Premium Features (Dev Week Mar 22-28)

We've recently completed a massive upgrade to the platform, transforming it into a premium experience:

- **💎 Glassmorphism UI:** A modern, translucent design with backdrop blurs and smooth transitions.
- **🌙 Adaptive Dark Mode:** Seamless theme switching with persistent user preferences.
- **🎲 Surprise Me:** A random search feature that selects fascinating topics from a curated list.
- **⚡ Performance Boost:** Optimized rendering using `DocumentFragment` for ultra-fast updates.
- **📱 Tablet Optimized:** Fully responsive layout with refined grid systems for all devices.
- **📤 Web Share API:** Instantly share interesting links using the native browser share feature.
- **📚 Smart Reading List:** Persistent storage with sorting (Newest/Oldest) and bulk clear options.

## 🚀 How it Works

The app interacts with two different APIs:
1. **[Open Library API](https://openlibrary.org/developers/api):** Used for finding books, authors, and publication years.
2. **[Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page):** Used for finding summaries of topics and general knowledge articles.

## 🛠️ Features

- **Dual API Integration:** Fetches results from both Open Library and Wikipedia simultaneously.
- **Card-based UI:** Results are displayed in a clean, organized card format.
- **BEM Naming:** Modern CSS architecture for high maintainability.
- **Error Handling:** Robust validation for API responses and network timeouts.
- **Responsive Design:** Works beautifully on mobile, tablet, and desktop.

## 📂 Project Structure

- `index.html`: The main entry point for the application.
- `style.css`: Contains all custom styles (Vanilla CSS).
- `app.js`: Handles API fetching, DOM manipulation, and app logic.
- `.gitignore`: Specifies files to be ignored by Git.

## 🎯 About

This project was built as part of the Final Projects for the study period at **African Leadership University (ALU)**.

**Created by:** Axcel Ishimwe
**Institution:** African Leadership University, Kigali, Rwanda
**Cohort:** ALU 2026

## 📜 Resources
- [Google Fonts](https://fonts.google.com/) - Outfit & Inter
- [Open Library API Documentation](https://openlibrary.org/developers/api)
- [Wikipedia API Documentation](https://www.mediawiki.org/wiki/API:Main_page)

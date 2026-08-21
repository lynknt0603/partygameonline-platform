# SPA hosting

BoardVerse web is a client-side React Router app.

Vite's dev server already rewrites unknown paths to `index.html`, so routes such as `/rooms/r-8892` and `/play/r-104` reload correctly in `npm run dev`.

Production servers must do the same: send every unmatched path to `apps/web/dist/index.html`. If they 404 instead, deep links break.

Examples:

- nginx: `try_files $uri $uri/ /index.html;`
- Netlify: `/* /index.html 200`
- GitHub Pages: a `404.html` that copies `index.html`, or a dedicated SPA plugin

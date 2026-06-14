const http = require('http');
const fs = require('fs');
const path = require('path');
const searchHandler = require('./netlify/functions/search').handler;

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);

  // Route API pour la fonction Netlify Search
  if ((req.url === '/.netlify/functions/search' || req.url === '/api/search') && (req.method === 'POST' || req.method === 'OPTIONS')) {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      });
      res.end('');
      return;
    }

    // Récupérer le corps de la requête POST
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        // Simuler l'événement Netlify
        const event = {
          httpMethod: req.method,
          body: body,
          headers: req.headers
        };

        // Appeler la fonction Netlify
        const result = await searchHandler(event, {});

        // Renvoyer la réponse
        res.writeHead(result.statusCode || 200, {
          ...result.headers,
          'Access-Control-Allow-Origin': '*' // S'assurer que le CORS passe en local
        });
        res.end(result.body);
      } catch (err) {
        console.error('Erreur lors de l\'exécution de la fonction de recherche:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erreur interne du serveur lors de la recherche.' }));
      }
    });
    return;
  }

  // Gestion des fichiers statiques
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // Nettoyer d'éventuels paramètres d'URL (?t=...)
  filePath = filePath.split('?')[0];
  
  let decodedPath = filePath;
  try {
    decodedPath = decodeURIComponent(filePath);
  } catch (e) {
    // En cas d'URL mal formée
  }
  
  const fullPath = path.join(__dirname, decodedPath);

  // Vérifier si le fichier existe et n'est pas un dossier
  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Fichier non trouvé');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(fullPath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` Serveur GZ Data démarré avec succès !`);
  console.log(` URL locale : http://localhost:${PORT}`);
  console.log(` Les requêtes de recherche utiliseront de vraies données Brix.`);
  console.log(`===================================================`);
});

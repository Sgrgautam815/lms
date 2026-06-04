const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Normalize URL path
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Safety check (prevent directory traversal)
    if (!filePath.startsWith(__dirname)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath);
    let contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // If it is a directory, try appending index.html
                fs.stat(filePath, (statErr, stats) => {
                    if (!statErr && stats.isDirectory()) {
                        const indexFilePath = path.join(filePath, 'index.html');
                        fs.readFile(indexFilePath, (indexErr, indexContent) => {
                            if (indexErr) {
                                res.statusCode = 404;
                                res.end('Not Found');
                            } else {
                                res.writeHead(200, { 'Content-Type': 'text/html' });
                                res.end(indexContent, 'utf-8');
                            }
                        });
                    } else {
                        res.statusCode = 404;
                        res.end('Not Found');
                    }
                });
            } else {
                res.statusCode = 500;
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Frontend server is running at http://localhost:${PORT}`);
});

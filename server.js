// Startup file untuk hosting cPanel "Setup Node.js App" (Phusion Passenger) atau server Node biasa.
// Jalankan `npm install` dan `npm run build` terlebih dahulu.
const { createServer } = require('http');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	createServer((req, res) => handle(req, res)).listen(port, () => {
		console.log(`Geprex Next.js berjalan di port ${port}`);
	});
});

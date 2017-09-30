/* Service Worker */
	var cacheName = 'v0.1.0';
	var cacheFiles = [
		'./index.html',
		'./manifest.json',
		'./code/theme.css',
		'./code/webapp.js',
		'./content/images/logo.ico'
	];
/* Install */
	self.addEventListener('install', function(event) {
		console.log("Installed");

		event.waitUntil(
			caches.open(cacheName).then(function(cache) {
				console.log("Caching cacheFiles");
				return cache.addAll(cacheFiles);
			})
		);
	});
/* Activate */
	self.addEventListener('activate', function(event) {
		console.log("Activated");

	});
/* Fetch */
	self.addEventListener('fetch', function(event) {
		console.log("Fetching", event.request.url);
	});

/* END */
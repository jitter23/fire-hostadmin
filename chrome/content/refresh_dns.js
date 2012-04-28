(function(hostAdmin){

		var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var cacheService = Components.classes["@mozilla.org/network/cache-service;1"].getService(Components.interfaces.nsICacheService);

		var refresh_dns = function(){
			// this funtion learn from addon dnsFlush 
			// https://addons.mozilla.org/firefox/addon/dns-flusher/
			// thanks to Marco Tulio
			// http://code.google.com/p/coderstech/source/browse/trunk/dnsFlusher/chrome/content/dnsFlusher/js/dnsFlusher.js#192

			try{
				ioService.offline = true;
				cacheService.evictEntries(Components.interfaces.nsICache.STORE_ANYWHERE);
			}catch(e){}
			finally{
				ioService.offline = false;
			}
		}

		document.addEventListener('HostAdminRefresh', function(e) {
			refresh_dns();
		}, false);

		hostAdmin.refresh_dns = refresh_dns;
})(window.hostAdmin);

(function(hostAdmin){

		hostAdmin.refresh_dns = function(){
			// this funtion learn from addon dnsFlush 
			// https://addons.mozilla.org/firefox/addon/dns-flusher/
			// thanks to Marco Tulio
			// http://code.google.com/p/coderstech/source/browse/trunk/dnsFlusher/chrome/content/dnsFlusher/js/dnsFlusher.js#192

			if(typeof Cc !="undefined"){ // when loading
				var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
				try{
					ioService.offline = true;
					var cacheService = Components.classes["@mozilla.org/network/cache-service;1"].getService(Components.interfaces.nsICacheService);
					cacheService.evictEntries(Components.interfaces.nsICache.STORE_ANYWHERE);
				}catch(e){}
				finally{
					ioService.offline = false;
				}
			}
		}
})(window.hostAdmin);

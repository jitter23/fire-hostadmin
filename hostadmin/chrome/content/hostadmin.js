var hostAdmin = (function(){

	
	// copy from io.js
	// http://kb.mozillazine.org/Dev_:_Extensions_:_Example_Code_:_File_IO_:_jsio
	
	var FileIO = {

		localfileCID  : '@mozilla.org/file/local;1',
		localfileIID  : Components.interfaces.nsILocalFile,

		finstreamCID  : '@mozilla.org/network/file-input-stream;1',
		finstreamIID  : Components.interfaces.nsIFileInputStream,

		foutstreamCID : '@mozilla.org/network/file-output-stream;1',
		foutstreamIID : Components.interfaces.nsIFileOutputStream,

		sinstreamCID  : '@mozilla.org/scriptableinputstream;1',
		sinstreamIID  : Components.interfaces.nsIScriptableInputStream,

		suniconvCID   : '@mozilla.org/intl/scriptableunicodeconverter',
		suniconvIID   : Components.interfaces.nsIScriptableUnicodeConverter,

		open   : function(path) {
			try {
				var file = Components.classes[this.localfileCID]
								.createInstance(this.localfileIID);
				file.initWithPath(path);
				return file;
			}
			catch(e) {
				return false;
			}
		},

		read   : function(file, charset) {
			try {
				var data     = new String();
				var fiStream = Components.classes[this.finstreamCID]
									.createInstance(this.finstreamIID);
				var siStream = Components.classes[this.sinstreamCID]
									.createInstance(this.sinstreamIID);
				fiStream.init(file, 1, 0, false);
				siStream.init(fiStream);
				data += siStream.read(-1);
				siStream.close();
				fiStream.close();
				if (charset) {
					data = this.toUnicode(charset, data);
				}
				return data;
			} 
			catch(e) {
				return false;
			}
		},

		write  : function(file, data, mode, charset) {
			try {
				var foStream = Components.classes[this.foutstreamCID]
									.createInstance(this.foutstreamIID);
				if (charset) {
					data = this.fromUnicode(charset, data);
				}
				var flags = 0x02 | 0x08 | 0x20; // wronly | create | truncate
				if (mode == 'a') {
					flags = 0x02 | 0x10; // wronly | append
				}
				foStream.init(file, flags, 0664, 0);
				foStream.write(data, data.length);
				// foStream.flush();
				foStream.close();
				return true;
			}
			catch(e) {
				return false;
			}
		},

		create : function(file) {
			try {
				file.create(0x00, 0664);
				return true;
			}
			catch(e) {
				return false;
			}
		},

		unlink : function(file) {
			try {
				file.remove(false);
				return true;
			}
			catch(e) {
				return false;
			}
		},

		path   : function(file) {
			try {
				return 'file:///' + file.path.replace(/\\/g, '\/')
							.replace(/^\s*\/?/, '').replace(/\ /g, '%20');
			}
			catch(e) {
				return false;
			}
		},

		toUnicode   : function(charset, data) {
			try{
				var uniConv = Components.classes[this.suniconvCID]
									.createInstance(this.suniconvIID);
				uniConv.charset = charset;
				data = uniConv.ConvertToUnicode(data);
			} 
			catch(e) {
				// foobar!
			}
			return data;
		},

		fromUnicode : function(charset, data) {
			try {
				var uniConv = Components.classes[this.suniconvCID]
									.createInstance(this.suniconvIID);
				uniConv.charset = charset;
				data = uniConv.ConvertFromUnicode(data);
				// data += uniConv.Finish();
			}
			catch(e) {
				// foobar!
			}
			return data;
		}

	}

	
	
	var host_file_wrapper = (function(){	

		var file_name = "";
		var os = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;

		var charset = "utf8";

		if (os == "WINNT"){
			charset = "gbk";
			try {
				var hs = Components.classes["@phpsix.net/hostadmin;1"].getService(Components.interfaces.IhostAdmin);
				file_name = hs.getHostPath();
			}
			catch (err) {
				//alert("use default");
				file_name = "C:\\windows\\system32\\drivers\\etc\\hosts";
			}
			
		}else if(os == "Linux"){
			file_name = "/etc/hosts";
		}
		
		return {
			get : function(){
				var file = FileIO.open(file_name);
				return FileIO.read(file, charset);
			}
			,
			set : function(data){
				var file = FileIO.open(file_name);
				return FileIO.write(file, data, '', charset);
			}
			,
			time : function(){
				var file = FileIO.open(file_name);
				return file.lastModifiedTime;
			}
		};
	})();
	
		//public 
		
	
	var host_admin = (function(){
		var ip_regx = /^((1?\d?\d|(2([0-4]\d|5[0-5])))\.){3}(1?\d?\d|(2([0-4]\d|5[0-5])))$/;
		var lines = [];
		var hosts = {};
		//public 
		
		var loadhost = function() {
		
			lines = [];
			hosts = {};
			//read
			var host = host_file_wrapper.get();
			host += "\n";
			
			var l_p = 0; //pointer to line
			regx = /(.*?)\r?\n/mg
			while(l = regx.exec(host)){
				l = l[0];
				
				lines[l_p++] = l;
				
				l = l.replace(/^(\s*#)+/,"#");
				l = l.replace(/#/g,"# ");
				l = l.replace(/^\s+|\s+$/g,"");
				l = l.replace(/\s+/g," ");
				
				var tks = l.split(" ");
							
				var using = true;
				if (tks[0] == "#"){
					using = false;
					tks.splice(0,1);
				}
				
				var ip = "";
				if (ip_regx.test(tks[0])){
					ip = tks[0];
					tks.splice(0,1);
				}else{
					continue;
				}
				
	
				var comment = "";

				var names = [];
				var findc = false;
				for (i in tks){
					if(tks[i] == "#"){
						var findc = true;
						continue;
					}
					
					if(findc){
						comment += tks[i] + " ";
					}else{
						names.push(tks[i]);
					}
				}


				ip = {
					addr : ip, 
					using : using ,
					line : l_p - 1,
					comment : comment.substr(0,6)
				};
	
				for (i in names){
					var name = names[i];
					if(typeof hosts[name] == "undefined"){
						hosts[name] = [];
					}
					
					hosts[name].push(ip);
				}
			   
				
			}
		};
		
		
		/*  
		 * host_name host名字
		 * ip_p ip的列表中指针
		 */
		var host_enable = function(host_name, ip_p){
			if(hosts[host_name]){			
				for (i in hosts[host_name]){
					var ip = hosts[host_name][i];
					if(ip.using){ //  && i != ip_p ){
						lines[ip.line] = "#" + lines[ip.line];
					}else if (!ip.using && i == ip_p ){
						lines[ip.line] = lines[ip.line].replace(/^(\s*#)+/,"");
					}
				}
			}
		}
		
		var mk_host = function(){
			var str = "";
			for (i in lines){
				str += lines[i];
			}
			return str;
		}
		
		var last_modify = 0;
		//loadhost();
		
		
		var refresh = function(){
			var t = host_file_wrapper.time();
			
			if( t != last_modify){
				loadhost();
				last_modify = t;
				
				var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
				var backToOnline = false; // learn from dnsFlusher (to fix offline bug)
				try{
					ioService.offline = true;
					var cacheService = Components.classes["@mozilla.org/network/cache-service;1"].getService(Ci.nsICacheService);
					cacheService.evictEntries(Ci.nsICache.STORE_ANYWHERE);
				}catch(e){}
				finally{
					if (!backToOnline && ioService){
						ioService.offline = false;
					}
				}
				return true;
			}
			return false;
		}
		
		return {
			get_hosts : function(){
				return hosts;
			},
			host_enable : host_enable,
			mk_host : mk_host,
			refresh : refresh
		};
		
	})();
	
	var curHost = "";

	var updatelb = function(){
		
		var str = "Not in Hosts";
		
		var hosts = host_admin.get_hosts();
		if (typeof hosts[curHost] != "undefined") {
			hosts = hosts[curHost];
			for (i in hosts){
				str = "In Hosts";
				if(hosts[i].using){
					str = hosts[i].addr + " " + hosts[i].comment;
					break;
				}
			}
		}		
		
		document.getElementById("hostadmin-label").value = str;
	}
	
	var menuitem = function(host_name, ip_p){
		host_admin.host_enable(host_name, ip_p);
		
		host_file_wrapper.set(host_admin.mk_host());
		host_admin.refresh();
		updatelb();
		//alert(host_admin.mk_host());
		//alert(host_name + ip_p);
		
	}
	
	var onclick = function(event){
		var menu = document.getElementById("hostadmin-popup");
		var lb = document.getElementById("hostadmin-label");
		
		var hosts = host_admin.get_hosts();

		if (typeof hosts[curHost] != "undefined") {
			while (menu.lastChild) menu.removeChild(menu.lastChild);

			hosts = hosts[curHost];
			for (i in hosts){
				h = hosts[i];
				var mi = document.createElement("menuitem");
				mi.setAttribute("label",h.addr + " " + h.comment);
				mi.setAttribute("type","checkbox");
				mi.setAttribute("oncommand","hostAdmin.menuitem('" + curHost + "'," + i + ");" );
				
				if(h.using){
					mi.setAttribute("checked",true);
				}
				menu.appendChild(mi);
			}	
			
			menu.openPopup(lb, "before_start", 0 ,0, true);
		}
		
		return true;
	}
	
	
	var host_refresh = { 
		observe: function(subject, topic, data){
			//dump("timeer\n");
			//alert('timer');
			if(host_admin.refresh()){
				updatelb();
			};
		} 
	}	
	var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	timer.init(host_refresh, 1000,	Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
	
	
	var onload = function(event){
	
		host_admin.refresh();
		
		window.getBrowser().addProgressListener({
			onLocationChange: function(aProgress, aRequest, aLocation){
					curHost = "";
					try{
						if (aLocation && aLocation.host){
							curHost = aLocation.host;
						}
					}
					catch(e){					
					}
					finally{	
						updatelb();
					}
				},
				onStateChange: function(a, b, c, d){
				},
				onProgressChange: function(a, b, c, d, e, f){
				},
				onStatusChange: function(a, b, c, d){
				},
				onSecurityChange: function(a, b, c){
				},
				onLinkIconAvailable: function(a){
				}
			}, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT );
	}
	
	var onpopup = function(){
		var menu = document.getElementById("hostadmin-popup");
	}
	
	return {
		load : onload ,
		click : onclick,
		popup : onpopup,
		menuitem : menuitem,
		timer: timer //prevent form being gc
	}

})();

window.addEventListener("load",hostAdmin.load, false);

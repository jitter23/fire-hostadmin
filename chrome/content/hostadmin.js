var hostAdmin = (function(){
	
	const EDITOR_URL = 'chrome://hostadmin/content/editor/hostadmin.html';
	const PERM_HELP_URL = 'http://code.google.com/p/fire-hostadmin/wiki/GAIN_HOSTS_WRITE_PERM';

	var fire_config = (function(){
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		prefs = prefs.getBranch("extensions.hostadmin.");

		return {
			get: function(key){
				if (prefs.prefHasUserValue(key)) {
					return prefs.getComplexValue(key, Components.interfaces.nsISupportsString).data;
				}else{
					return null;
				}
			},
			run_when_not_equal: function(key, value, f){
				var v = this.get(key);
				if(v && v != value){
					f(v);
				}
			}
		};
	})();

	var host_file_wrapper = (function(){	
		var s = {};
		Components.utils.import("resource://hostadminmodules/FileIO.jsm", s);
		
		const FileIO = s.FileIO;
		const os = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
		var splitchar = "\n";

		var charset = "utf8";
	
		// -- temp for windows before charset detector
		if (os == "WINNT"){
			charset = 'gbk';
		}

		var file_names = [];

		fire_config.run_when_not_equal("hostsfilepath", "default", function(configpath){
			file_names.push(configpath);
		});
	
		fire_config.run_when_not_equal("charset", "auto", function(c){
			charset = c;
		});

		if (os == "WINNT"){
			splitchar = "\r\n";
			try {
				var winDir = Components.classes["@mozilla.org/file/directory_service;1"].
				getService(Components.interfaces.nsIProperties).get("WinD", Components.interfaces.nsILocalFile); 
				file_names.push(winDir.path + "\\system32\\drivers\\etc\\hosts");
			}
			catch (err) {}

			file_names.push("C:\\windows\\system32\\drivers\\etc\\hosts");
		}else if(os == "Linux"){
			file_names.push("/etc/hosts");
		}else if(os == "Darwin"){
			file_names.push("/etc/hosts");
		}

		var file_name;
		for(var i in file_names){
			file_name = file_names[i];
			var _f = FileIO.open(file_name);
			if(_f && _f.exists()){
				break;
			}
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
			,
			splitchar : splitchar
		};
	})();
	
	var host_admin = (function(){
		const ip_regx = /^((1?\d?\d|(2([0-4]\d|5[0-5])))\.){3}(1?\d?\d|(2([0-4]\d|5[0-5])))$/;

		// copy from http://forums.intermapper.com/viewtopic.php?t=452
		const ip6_regx = /^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?$/ ;

		var lines = [];
		var hosts = {};
		var groups = {};
		
		var loadhost = function() {
		
			lines = [];
			hosts = {};
			groups = {};
			//read
			var host = host_file_wrapper.get();
			
			if (host && host.charAt(host.length - 1) != "\n"){ //fix no lf
				host += host_file_wrapper.splitchar;
			}

			var l_p = 0; //pointer to line
			const regx = /(.*?)\r?\n/mg
			var l = null;
			var group_id = 0;
			var group_c = 0;

			while(l = regx.exec(host)){
				l = l[0];
				
				lines[l_p++] = l;
				
				l = l.replace(/^(\s*#)+/,"#");
				l = l.replace(/#/g," # ");
				l = l.replace(/^\s+|\s+$/g,"");
				l = l.replace(/\s+/g," ");
				
				var tks = l.split(" ");

				if (tks[0] == "#" && tks[1] == "===="){
					if(group_c == 0){
						group_id++;
					}

					if(group_c++ % 2 == 0){
						tks.splice(0,2);
						var group_name = "";
						for(var i in tks){
							group_name += tks[i] + " ";
						}

						if(group_name == ""){
							group_name = "Group " + group_id;
						}

						groups[group_id] = group_name;
					}else{
						group_id++;
					}
					continue;	
				}
							
				var using = true;
				if (tks[0] == "#"){
					using = false;
					tks.splice(0,1);
				}
				
				var ip = "";
				if (ip_regx.test(tks[0]) || ip6_regx.test(tks[0])){
					ip = tks[0];
					tks.splice(0,1);
				}else{
					continue;
				}
				
				var comment = "";

				var names = [];
				var findc = false;
				for (var i in tks){
					if(tks[i] == "#"){
						findc = true;
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
					comment : comment,
					group : group_id
				};
	
				for (var i in names){
					var name = names[i];
					if(typeof hosts[name] == "undefined"){
						hosts[name] = [];
					}
				
					hosts[name].push(ip);
				}
			}
		};
		
		var line_enable = function(ip){
			if(!ip.using){
				lines[ip.line] = lines[ip.line].replace(/^(\s*#)+/,"");
			}
			ip.using = true;
		}

		var line_disable = function(ip){
			if(ip.using){
				lines[ip.line] = "#" + lines[ip.line];
			}
			ip.using = false;
		}

		var host_toggle = function(host_name, ip_p){
			if(hosts[host_name]){			
				for (var i in hosts[host_name]){
					var ip = hosts[host_name][i];
					
					if(i == ip_p && !ip.using){
						line_enable(ip);
					}else{
						line_disable(ip);
					}
				}
			}
		}

		var is_group_all_using = function(host_list, gp_p){
			for(var h in host_list){
				for (var i in hosts[host_list[h]]){
					var ip = hosts[host_list[h]][i];
					if(ip.group == gp_p && !ip.using){
						return false;
					}
				}
			}
			return true;
		}

		var group_toggle = function(host_list, gp_p){
			var using = is_group_all_using(host_list, gp_p);
			
			for(var h in host_list){
				for (var i in hosts[host_list[h]]){
					var ip = hosts[host_list[h]][i];
					
					if(ip.group == gp_p){
						if(using){
							line_disable(ip);
						}else{
							line_enable(ip);
						}
					}else if(ip.using){
						line_disable(ip);
					}
				}
			}
		}

		var mk_host = function(){
			var str = "";
			for (var i in lines){
				str += lines[i];
			}
			return str;
		}
		
		var last_modify = 0;
		
		// {{{		
		var refresh = function(){
			var t = host_file_wrapper.time();
			
			if( t != last_modify){
				loadhost();
				
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
				
				if(last_modify != 0){
					var e = document.createEvent('Events');
					e.initEvent('HostAdminRefresh', false, false);
					document.dispatchEvent(e);
				}

				last_modify = t;

				return true;
			}
			return false;
		}
		// }}}
		
		return {
			get_hosts : function(){
				return hosts;
			},
			get_groups : function(){
				return groups;
			},
			host_toggle : host_toggle,
			group_toggle : group_toggle,
			group_checked : is_group_all_using,
			mk_host : mk_host,
			refresh : refresh,
			reset_modified: function(){
				last_modify = 0;
			}
		};
		
	})();
	
	var curHost = "";

	var updatelb = function(){
		
		var str = "Not in Hosts";
		
		var hosts = host_admin.get_hosts();
		if (typeof hosts[curHost] != "undefined") {
			hosts = hosts[curHost];
			for (var i in hosts){
				str = "In Hosts";
				if(hosts[i].using){
					str = hosts[i].addr + " " + hosts[i].comment;
					break;
				}
			}
		}		
		
		document.getElementById("hostadmin-label").value = str;
	}

	var wrapped_set = function(data){
		var r = host_file_wrapper.set(data);
		if(!r){

			// reset time
			host_admin.reset_modified();	

			// alert
			var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
					    .getService(Components.interfaces.nsIAlertsService);

			alertsService.showAlertNotification('chrome://hostadmin/skin/icon32.png', 'HostAdmin'
			, 'Write hosts file failed check permissions, Click to Learn more',
			true, null,{  
				observe: function(subject, topic, data) {  
					if(topic == 'alertclickcallback'){
					var t = window.getBrowser().addTab(PERM_HELP_URL);
					window.getBrowser().selectedTab = t;
					}
				}  
			});
		}

		host_refresh.tick();	
		
		return r;
	}
	
	var mk_menu_item = function(hostname, host , host_index){
		var mi = document.createElement("menuitem");
		mi.setAttribute("label",host.addr);
		mi.setAttribute("acceltext", host.comment.substr(0,20));
		mi.setAttribute("description", "Double Click to Visit");
		mi.setAttribute("type","checkbox");
		mi.addEventListener("command", function(e){
			host_admin.host_toggle(hostname, host_index);
			wrapped_set(host_admin.mk_host());
		}, false);
		
		if(host.using){
			mi.setAttribute("checked",true);
		}
		return mi;
	}

	var mk_menu_gp_item = function(group_name, group_id, host_list){
		var mi = document.createElement("menuitem");
		mi.setAttribute("label", group_name.substr(0,35));
		mi.setAttribute("acceltext", "Group");
		mi.setAttribute("type","checkbox");
		mi.addEventListener("command", function(e){
			host_admin.group_toggle(host_list, group_id);
			wrapped_set(host_admin.mk_host());
		}, false);
		if(host_admin.group_checked(host_list, group_id)){
			mi.setAttribute("checked",true);
		}
		return mi;
	}

	const editor_item = (function(){
			var mi = document.createElement("menuitem");
			mi.setAttribute("label", "Host Editor");

			mi.addEventListener("command", function(e){
				var t = window.getBrowser().addTab(EDITOR_URL);
				window.getBrowser().selectedTab = t;
			}, false);
			return mi;
		})();

	// {{{ refresh menu
	var refresh_menu = function(){
		var menu = document.getElementById("hostadmin-popup");
		
		while (menu.lastChild) menu.removeChild(menu.lastChild);
		var hosts = host_admin.get_hosts();
		var group_names = host_admin.get_groups();
		var groups = [];

		var hasOther = false;
		var tosortKey = [];
		var tosortM = [];
			
		for (var h in hosts){
			var sub = document.createElement("menu");
			sub.setAttribute("label", h);

			sub.addEventListener("dblclick", (function(h){ 
				return function(e){
						var t = window.getBrowser().addTab(h);
						window.getBrowser().selectedTab = t;
					}
				})(h), false);

			sub.setAttribute("acceltext", h.charAt(0).toUpperCase());
			var popup = document.createElement("menupopup");
			sub.appendChild(popup);
			var hide = true;
			for (var i in hosts[h]){
				if(hosts[h][i].comment.toUpperCase() != 'HIDE '){
					popup.appendChild(mk_menu_item(h, hosts[h][i], i));
					hasOther = true;
					hide = false;
				}

				var g = hosts[h][i].group;
				var gn = group_names[g];
				if(gn){
					if(typeof groups[g] == "undefined"){
						groups[g] = [];
					}
					
					groups[g].push(h);
				}
			}

			if(!hide && h!= curHost){
				tosortKey.push(h);
				tosortM[h] = sub;
			}
		}
		tosortKey = tosortKey.sort()
		for (var k in tosortKey){
			menu.appendChild(tosortM[tosortKey[k]]);
		}

		if ( groups.length > 0){
			if(hasOther){
				menu.appendChild(document.createElement("menuseparator"));
			}

			for(var g in groups){
				menu.appendChild(mk_menu_gp_item(group_names[g], g, groups[g]));
			}
		}

		var hasCur = false;
		if (typeof hosts[curHost] != "undefined") {
			if(hasOther){
				menu.appendChild(document.createElement("menuseparator"));
			}
			hosts = hosts[curHost];
			for (var i in hosts){
				if(hosts[i].comment.toUpperCase() != 'HIDE '){
					menu.appendChild(mk_menu_item(curHost, hosts[i], i));
					hasCur = true;
				}
			}
			if(!hasCur && hasOther){
				menu.removeChild(menu.lastChild);
			}
		}


		if(hasOther || hasCur){
			menu.insertBefore(document.createElement("menuseparator"), menu.firstChild);
		}
		menu.insertBefore(editor_item, menu.firstChild);
	}
	// }}} refresh menu
	
	var onclick = function(event){
		if(event.button != 0) return false;

		host_refresh.tick();	
		refresh_menu();

		var menu = document.getElementById("hostadmin-popup");
		var lb = document.getElementById("hostadmin-label");

		menu.openPopup(lb, "before_start", 0 ,0, true);
		return false;
	}
	

	var host_refresh = { 
		
		observe: function(subject, topic, data){
			this.tick();
		},

		tick: function(){
			if(host_admin.refresh()){
				// refresh_menu();
				updatelb();
			};
		}
		
	}	

	var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	timer.init(host_refresh, 1000,	Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
	

	var onload = function(event){
		host_refresh.tick();	
		
		window.getBrowser().addProgressListener({
				onLocationChange: function(aWebProgress, aRequest, aLocation){
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
			}, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT );

		window.getBrowser().addEventListener('pageshow', function(e){
			if(e.target && e.target.documentURI == EDITOR_URL){
				
				var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				                              .getService(Components.interfaces.nsIPromptService);

				//var doc = e.originalTarget;
				var doc = e.target;

				var codeMirror = e.target.defaultView.wrappedJSObject['editor'];
				var changed = function(){
					return e.target.defaultView.wrappedJSObject['changed'];
				}
				
				codeMirror.setValue(host_file_wrapper.get());

				document.addEventListener('HostAdminRefresh', function(e) {
					// TODO confirm parent ...
					if(!changed() || promptService.confirm(null, 'HostAdmin', 'Hosts file changed, Reload ?')){	
						codeMirror.setValue(host_file_wrapper.get());
						renew();
					}
				}, false);
				

				var save = doc.getElementById("btnSave");

				var falseChanged = function(){
					e.target.defaultView.wrappedJSObject['changed'] = false;
				}

				var disableButton = function(){
					save.setAttribute("disabled", "disabled")
				}

				var renew = function(){
					falseChanged();
					disableButton();
				}

				save.addEventListener('click', function(e) {
					falseChanged();
					if(wrapped_set(codeMirror.getValue())){
						renew();
					}
				}, false);

				renew();
			}
			
		}, false);
	}
	
	var onpopup = function(){
		var menu = document.getElementById("hostadmin-popup");
	}
	
	return {
		load : onload ,
		click : onclick,
		popup : onpopup,
		timer: timer //prevent form being gc
	}

})();

window.addEventListener("load",hostAdmin.load, false);

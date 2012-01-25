var hostAdmin = (function(){
	
	const EDITOR_URL = 'chrome://hostadmin/content/editor/hostadmin.html';

	var host_file_wrapper = (function(){	
		var s = {};
		Components.utils.import("chrome://hostadmin/content/FileIO.jsm", s);
		
		const FileIO = s.FileIO;
		const splitchar = "\n";
		const os = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;

		var charset = "utf8";
		var file_name = "";

		if (os == "WINNT"){
			charset = "gbk";
			splitchar = "\r\n";
			try {
				var winDir = Components.classes["@mozilla.org/file/directory_service;1"].
				getService(Components.interfaces.nsIProperties).get("WinD", Components.interfaces.nsILocalFile); 
				file_name = winDir.path + "\\system32\\drivers\\etc\\hosts";
			}
			catch (err) {
				//alert("use default");
				file_name = "C:\\windows\\system32\\drivers\\etc\\hosts";
			}
		}else if(os == "Linux"){
			file_name = "/etc/hosts";
		}else if(os == "Darwin"){
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
			,
			splitchar : splitchar
		};
	})();
	
	var host_admin = (function(){
		const ip_regx = /^((1?\d?\d|(2([0-4]\d|5[0-5])))\.){3}(1?\d?\d|(2([0-4]\d|5[0-5])))$/;
		var lines = [];
		var hosts = {};
		var groups = {};
		
		var loadhost = function() {
		
			lines = [];
			hosts = {};
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
					if(group_c++ % 2 == 0){
						group_id++;
						tks.splice(0,2);
						var group_name = "";
						for(var i in tks){
							group_name += tks[i] + " ";
						}

						if(group_name == ""){
							group_name = "Group " + group_id;
						}

						groups[group_id] = group_name;
					}
					continue;	
				}
							
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
					
					if(i == ip_p){
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
				last_modify = t;
				
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
				
				var e = document.createEvent('Events');
				e.initEvent('HostAdminRefresh', false, false);
				document.dispatchEvent(e);

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
			refresh : refresh
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
	
	var mk_menu_item = function(hostname, host , host_index){
		var mi = document.createElement("menuitem");
		mi.setAttribute("label",host.addr + " " + host.comment.substr(0,6));
		mi.setAttribute("type","checkbox");
		mi.addEventListener("command", function(e){
			host_admin.host_toggle(hostname, host_index);
			host_file_wrapper.set(host_admin.mk_host());
			host_refresh.tick();	
		});
		
		if(host.using){
			mi.setAttribute("checked",true);
		}
		return mi;
	}

	var mk_menu_gp_item = function(group_name, group_id, host_list){
		var mi = document.createElement("menuitem");
		mi.setAttribute("label", "<Group> " + group_name.substr(0,15));
		mi.setAttribute("type","checkbox");
		mi.addEventListener("command", function(e){
			host_admin.group_toggle(host_list, group_id);
			host_file_wrapper.set(host_admin.mk_host());
			host_refresh.tick();	
		});
		if(host_admin.group_checked(host_list, group_id)){
			mi.setAttribute("checked",true);
		}
		return mi;
	}

	var onclick = function(event){
		if(event.button != 0) return false;

		var menu = document.getElementById("hostadmin-popup");
		var lb = document.getElementById("hostadmin-label");
		
		while (menu.lastChild) menu.removeChild(menu.lastChild);
		var hosts = host_admin.get_hosts();
		var group_names = host_admin.get_groups();
		var groups = [];

		var hasOther = false;
		var tosortKey = [];
		var tosortM = [];
			
		for (var h in hosts){
			if(h != curHost){
				var sub = document.createElement("menu");
				sub.setAttribute("label", "["+ h.charAt(0).toUpperCase() +"] " + h);
				var popup = document.createElement("menupopup");
				sub.appendChild(popup);
				var hide = true;
				for (var i in hosts[h]){
					if(hosts[h][i].comment.toUpperCase() != 'HIDE '){
						popup.appendChild(mk_menu_item(h, hosts[h][i], i));
						hasOther = true;
						hide = false;
						
						var g = hosts[h][i].group;
						var gn = group_names[g];
						if(gn){
							if(typeof groups[g] == "undefined"){
								groups[g] = [];
							}
							
							groups[g].push(h);
						}
					}
				}

				if(!hide){
					tosortKey.push(h);
					tosortM[h] = sub;
				}
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
			if(!hasCur){
				menu.removeChild(menu.lastChild);
			}
		}
		if(hasOther || hasCur){
			menu.openPopup(lb, "before_start", 0 ,0, true);
		}
		return false;
	}
	

	var host_refresh = { 
		
		observe: function(subject, topic, data){
			this.tick();
		},

		tick: function(){
			if(host_admin.refresh()){
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
				var doc = e.originalTarget;

				var codeMirror = e.target.defaultView.wrappedJSObject['editor'];
				
				document.addEventListener('HostAdminRefresh', function(e) {
					codeMirror.setValue(host_file_wrapper.get());
				}, false);
				
				codeMirror.setValue(host_file_wrapper.get());

				var save = doc.getElementById("btnSave");
				save.addEventListener('click', function(e) {
					host_file_wrapper.set(codeMirror.getValue());
					host_refresh.tick();	
				});
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

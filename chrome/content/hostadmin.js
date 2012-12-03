(function(hostAdmin){
	
	const EDITOR_URL = 'chrome://hostadmin/content/editor/hostadmin.html';
	const PERM_HELP_URL = 'http://code.google.com/p/fire-hostadmin/wiki/GAIN_HOSTS_WRITE_PERM';

	var host_file_wrapper = hostAdmin.host_file_wrapper;
	var host_admin = hostAdmin.core;
	
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

			try{
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
			}catch(e){} // mac without growl
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
	

	var onclick = function(target, event){
		if(event.button && event.button != 0) return false;

		host_refresh.tick();	
		refresh_menu();

		var menu = document.getElementById("hostadmin-popup");

		menu.openPopup(target, "before_end", 0 ,0, true);
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
		
		var panel_label = document.getElementById("hostadmin-label");
		panel_label.addEventListener('mousedown', function(e) {
			onclick(panel_label, e);
		}, false);
		
		var toolbar_button = document.getElementById("hostadmin-toolbar-button");
		if(toolbar_button){
			toolbar_button.addEventListener('command', function(e) {
				onclick(toolbar_button, e);
			}, false);
		}

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
			});

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

				// limit alert only once per editor
				doc.alert_mutex = false;

				var mutex_prompt = function(){
					if(!doc.alert_mutex){
						doc.alert_mutex = true;

						try{
							return promptService.confirm(null, 'HostAdmin', 'Hosts file changed, Reload ?');
						}finally{
							doc.alert_mutex = false;
						}
					}
					return false;
				}

				document.addEventListener('HostAdminRefresh', function(e) {
					if(!changed() || mutex_prompt()){
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
					if(changed()){
						falseChanged();
						if(wrapped_set(codeMirror.getValue())){
							renew();
						}
					}
				}, false);

				renew();
			}
			
		}, false);
	}
	
	
	hostAdmin.dontgc = timer; //prevent form being gc

	window.addEventListener("load", onload, false);

})(window.hostAdmin);


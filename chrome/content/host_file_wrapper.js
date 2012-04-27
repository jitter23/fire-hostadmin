// HostAdmin
// by T.G.(farmer1992@gmail.com)
//
// file wrapper module 
// enable hostadmin read and set hosts file
//
(function(hostAdmin){

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
		Components.utils.import("resource://hostadminmodules/jschardet.jsm", s);

		const FileIO = s.FileIO;
		const jschardet = s.jschardet;
		const os = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
		var splitchar = "\n";

	
		var file_names = [];

		fire_config.run_when_not_equal("hostsfilepath", "default", function(configpath){
			file_names.push(configpath);
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
	
		var charset = "utf8"; // null means auto

		// detect using jschardet
		// but maybe unqualified
		if(!charset){
			// -- temp for windows before charset detector
			if (os == "WINNT"){
				charset = 'gbk';
			}

			//var file = FileIO.open(file_name);
			//charset = jschardet.detect(FileIO.read(file));
			//charset = charset ? charset.encoding : "utf8";
		}

		fire_config.run_when_not_equal("charset", "auto", function(c){
			charset = c;
		});

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
	
	hostAdmin.host_file_wrapper  = host_file_wrapper;
})(window.hostAdmin);

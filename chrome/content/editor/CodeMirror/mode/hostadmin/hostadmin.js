CodeMirror.defineMode("hostadmin", function(config, parserConfig) {
	var ipv4 = /\s*((1?\d?\d|(2([0-4]\d|5[0-5])))\.){3}(1?\d?\d|(2([0-4]\d|5[0-5])))/;
	var ipv6 = /\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?/ 

	return {
		startState: function() {return {
			hasIp: false,
			groupline: false,
			groupid: 0
		};},

		token: function(stream, state) {
			var ch = stream.next();
			if (ch == "#") {
				if(stream.match(/====\s/) || stream.match(/====$/) ){
					state.groupline = true;
					state.groupid++;
					return "keyword";
				}
				
				stream.eatWhile(/[#\s]/);
				if(!state.hasIP && (stream.match(ipv4, false) || stream.match(ipv6, false))){
					state.hasIP = true;
					return "keyword";
				}
				
				if(stream.match(/^\s*hide/i) && !stream.match(/[^\s]/, false)){
					return "keyword";
				}

				state.groupline = false;
				state.hasIP = false;
				stream.skipToEnd(); 
				return "comment";
			}

			if(stream.match(ipv4) || stream.match(ipv6)){
				return "number";
			}

			if(state.groupline && state.groupid % 2 == 1){
				stream.skipToEnd(); 
				state.groupline = false;
				return "comment";
			}

			if(stream.eol()){
				state.hasIP = false;
				state.groupline = false;
			}

			return null;
		},

	};
});

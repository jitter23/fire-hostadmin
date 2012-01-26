CodeMirror.defineMode("hostadmin", function(config, parserConfig) {
	var ipv4 = /^((1?\d?\d|(2([0-4]\d|5[0-5])))\.){3}(1?\d?\d|(2([0-4]\d|5[0-5])))/;

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
				if(!state.hasIP && stream.match(ipv4, false)){
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

			if(stream.match(ipv4)){
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

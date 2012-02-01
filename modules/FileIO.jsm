var EXPORTED_SYMBOLS = ["FileIO"];



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

};



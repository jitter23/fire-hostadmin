// this file is just a loader for gecko to use jschardet by aadsm
// orignal jschardet could be found
// https://github.com/aadsm/jschardet
//
// loader by T.G.(farmer1992@gmail.com)

var EXPORTED_SYMBOLS = ["jschardet"];

var mozIJSSubScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                            .getService(Components.interfaces.mozIJSSubScriptLoader);

const JSCHARDET_PATH = "resource://hostadminmodules/jschardet/";

var load = function(file){
	mozIJSSubScriptLoader.loadSubScript(JSCHARDET_PATH + file ,this);
}


load("init.js");
load("constants.js");
load("codingstatemachine.js");
load("escsm.js");
load("mbcssm.js");

load("charsetprober.js");
load("mbcharsetprober.js");

load("jisfreq.js");
load("gb2312freq.js");
load("euckrfreq.js");
load("big5freq.js");
load("euctwfreq.js");
load("chardistribution.js");

load("jpcntx.js");
load("sjisprober.js");
load("utf8prober.js");
load("charsetgroupprober.js");

load("eucjpprober.js");
load("gb2312prober.js");
load("euckrprober.js");
load("big5prober.js");
load("euctwprober.js");
load("mbcsgroupprober.js");

load("sbcharsetprober.js");

load("langgreekmodel.js");
load("langthaimodel.js");
load("langbulgarianmodel.js");
load("langcyrillicmodel.js");
load("hebrewprober.js");
load("langhebrewmodel.js");
load("langhungarianmodel.js");
load("sbcsgroupprober.js");

load("latin1prober.js");
load("escprober.js");
load("universaldetector.js");

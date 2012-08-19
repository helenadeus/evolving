/**
 * @author Helena
 */
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};
if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp */)
  {
    "use strict";
 
    if (this == null)
      throw new TypeError();
 
    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun != "function")
    {
    	
    }
      //throw new TypeError();
 
    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t))
          res.push(val);
      }
    }
 
    return res;
  };
}
Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

Array.prototype.getUnique = function(){
   var u = {}, a = [];
   for(var i = 0, l = this.length; i < l; ++i){
      if(u.hasOwnProperty(this[i])) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
};

var GET = [];
function get() {
        var query = unescape(window.location.search.replace("?",""));
        if(query){
                //Separate the parameters of the query
                var query = query.replace(/\n/g, ' ');
                var splitQuery = query.split("&");
                for (var i=0; i<splitQuery.length; i++) {
                        if(typeof(splitQuery[i])==='string'){
                                //var tmp = splitQuery[i].match(/([A-Za-z0-9_]+)=(.*)/);
                                var tmp = splitQuery[i].match(/([A-Za-z0-9_]+)=/);
                                if(tmp){
                                        //GET[tmp[1]] = tmp[2];
                                        GET[tmp[1]] = splitQuery[i].replace(tmp[0],'');
                                }
                        }

                }

        
        }
};
/**
 * @author Helena
 */
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return !(a.indexOf(i) > -1);});
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
/**
 * @author Helena
 */
var graph = {};

graph.buildRadial = function (){
		data.datesScope = $.unique(data.allRulesDays.concat(data.allStatsDays)).sort();
		
		//total days evolving
		//Set the two dates
		var d1 = new Date(Date.parse(data.datesScope[0],"yyyy-MM-dd"))
		var d2 = new Date(Date.parse(data.datesScope[data.datesScope.length-1],"yyyy-MM-dd"))
		//Set 1 day in milliseconds
		var one_day=1000*60*60*24
		//Calculate difference btw the two dates, and convert to days
		var totalDaysEvolving = Math.ceil((d2.getTime()-d1.getTime())/(one_day));
		
		//for each day evolving, create a data.datesScope
		data.fullDatesScope = [];
		for (var i=0; i <= totalDaysEvolving; i++) {
		  //totalDaysEvolving[i]
		  newDay = new Date(d1.getTime()+one_day*(i));
		  date_str=(newDay.getFullYear())+'-'+('0'+(newDay.getMonth()+1)).substr(-2,2)+'-'+('0'+newDay.getDate()).substr(-2,2);
			data.fullDatesScope.push(date_str);
		};
		
		data.countRulesSortedByDate = [];
		data.countStatsSortedByDate = [];
		previousRuleCount = 0;
		previousStatsCount = 0;
		
		
		for (var v=0; v < data.fullDatesScope.length; v++) {
			var date = data.fullDatesScope[v];
			//acconting for days when there were no rules or not items added 
			if(typeof(data.rulesPerDay[date])=='undefined'){
				data.rulesPerDay[date] = 0;
			}
			
			data.countRulesSortedByDate.push(previousRuleCount+data.rulesPerDay[date])
			previousRuleCount = previousRuleCount+data.rulesPerDay[date];
			if(typeof(data.createdStatementsItems[date])=='undefined'){
				data.createdStatementsItems[date] = 0;
			}
			data.countStatsSortedByDate.push(previousStatsCount+data.createdStatementsItems[date]);
			previousStatsCount = previousStatsCount+data.createdStatementsItems[date];
		}
		
		var limitBin = 30;
		
		//if the fullDatesScope is very large (+100), get less intervales
		data.intervalDates = [];data.intervalcountRules = [];data.intervalcountStats = [];
		if(data.fullDatesScope.length>=limitBin){
			var intLen = Math.ceil(data.fullDatesScope.length/limitBin);
			for (var i=0; i <= data.fullDatesScope.length; i=i+intLen) {
			  data.intervalDates.push(data.fullDatesScope[i]);
			  data.intervalcountRules.push(data.countRulesSortedByDate[i]);
			  data.intervalcountStats.push(data.countStatsSortedByDate[i]);
			  
			};
		}
		else
		{
			data.intervalDates = data.fullDatesScope;
			data.intervalcountRules = data.countRulesSortedByDate;
			data.intervalcountStats = data.countStatsSortedByDate;
			
			
		}
		//change the fullDatesScope Var
		
		
		
		//var radar = new RGraph.Radar('radar1', [7,6,6,7,8,6,7,7,6,6], [4,5,6,10,4,3,5,4,6,5], [4,3,5,7,6,5,3,2,4,5]);
		var radar = new RGraph.Radar('radar1', data.intervalcountRules, data.intervalcountStats);
            radar.Set('chart.strokestyle', 'black');
            radar.Set('chart.colors.alpha', 0.3);
            radar.Set('chart.colors', ['red', 'green', 'yellow']);
            
            if (!RGraph.isOld()) {
                radar.Set('chart.tooltips', [
                                              
                                             ]);
            }

            radar.Set('chart.key', ['Rules','Statements']);
            radar.Set('chart.key.position', 'graph');
            radar.Set('chart.labels', data.intervalDates);
            radar.Set('chart.gutter.top', 35);
            radar.Set('chart.accumulative', true);
            radar.Set('chart.labels.axes', '');
            radar.Set('chart.axes.color', 'transparent');
            //radar.Set('chart.background.circles.spacing', 25);
            radar.Draw();
            //console.log('worky?');
		
}
graph.AssembleTopologyJson = function (){
	data.jsondata = {};
	var allcol = s3db.collections.map ( function (d) {return d.name } )
	for(var day in data.dayOntologyEdges){
		var edges = data.dayOntologyEdges[day];
		data.jsondata[day] = {};
		var sources = edges.map (function (e){ return e.source});
		var sinks = edges.map (function (e){ return e.sink});
		var ids = edges.map (function (e){ return e.rule_id});
		var nodes = sources.concat(sinks).getUnique();
		nodes = nodes.diff(['UID', 's3dbVerb']);
		nodes[nodes.length] = 'root';
		data.jsondata[day].nodes = nodes.map ( function (name, i){
			if(name=='root'){return {"name" : name, "size": 15, "group": 1} }
			else { 
				if(allcol.indexOf(name)!==-1){
				return {"name" : name, "size": 15, "group": 2} 
				}
				else
				{
					return {"name" : name, "size": 15, "group": 3} 
					
				}
				
			}
		})
		
		data.jsondata[day].links = [];
		for (var i=0; i < edges.length; i++) {
		  if(edges[i].sink!=='UID' && edges[i].source!=='s3dbVerb'){
		  	data.jsondata[day].links.push ( {"source": nodes.indexOf(edges[i].source),"target":nodes.indexOf(edges[i].sink), "value":  edges[i].label})
		  }
		  if(edges[i].sink=='UID' && edges[i].source!=='s3dbVerb'){
		  	data.jsondata[day].links.push ( {"source": nodes.length-1,"target":nodes.indexOf(edges[i].source), "value":  "connection"})
		  }
		};
		$('#chart').append(
			$('<div id="chart_'+day+'"></div>').hide()	
		)
		graph.drawTopology(data.jsondata[day], day)
		//now add a button that will draw this topology
		$('#day_buttons').append(
			$('<input type="button" value="'+day+'"></input>').click(
				
				function (){
					var day = this.value;
					$('#chart_'+graph.previousClicked).hide();
					$('#chart_'+day).show();
					graph.previousClicked = day;
				}
				
			)
		)
		
	}
	//graph.drawTopology(data.jsondata[day], day);
	console.log('worky?');
}
graph.drawTopology = function (json,day){
	
	/*var json = {
"nodes":[{"name":"Myriel","group":1, "size":5},{"name":"Napoleon","group":1, "size":10},{"name":"Mlle.Baptistine","group":1, "size":5},{"name":"Mme.Magloire","group":1, "size":5}],
"links":[{"source":1,"target":0,"value":1},{"source":1,"target":1,"value":3}, {"source":1,"target":2,"value":3, "size":1}, {"source":1,"target":3,"value":3, "size":1}]
};
	*/
	
	var width = 960,
    height = 500;

	var color = d3.scale.category20();
	
	var force = d3.layout.force()
	    .charge(-1000)
	    .linkDistance(50)
	    .size([width, height]);
	
	var svg = d3.select("#chart_"+day).append("svg")
	    .attr("width", width)
	    .attr("height", height);

	
	force
      .nodes(json.nodes)
      .links(json.links)
      .start();

  var link = svg.selectAll("line.link")
      .data(json.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.selectAll("circle.node")
      .data(json.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", function(d) { return d.size; })
      .style("fill", function(d) { return color(d.group); })
      .call(force.drag);

  node.append("title")
      .text(function(d) { return d.name; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });
  
	
}

/**
 * @author Helena
 */
var graph = {};

graph.buildDiagram = function (){
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
		
		
		//var radar = new RGraph.Radar('radar1', [7,6,6,7,8,6,7,7,6,6], [4,5,6,10,4,3,5,4,6,5], [4,3,5,7,6,5,3,2,4,5]);
		var radar = new RGraph.Radar('radar1', data.countRulesSortedByDate, data.countStatsSortedByDate);
            radar.Set('chart.strokestyle', 'black');
            radar.Set('chart.colors.alpha', 0.3);
            radar.Set('chart.colors', ['red', 'green', 'yellow']);
            
            if (!RGraph.isOld()) {
                radar.Set('chart.tooltips', [
                                              
                                             ]);
            }

            radar.Set('chart.key', ['Rules','Statements']);
            radar.Set('chart.key.position', 'graph');
            radar.Set('chart.labels', data.fullDatesScope);
            radar.Set('chart.gutter.top', 35);
            radar.Set('chart.accumulative', true);
            radar.Set('chart.labels.axes', '');
            radar.Set('chart.axes.color', 'transparent');
            //radar.Set('chart.background.circles.spacing', 25);
            radar.Draw();
            console.log('worky?');
		
}
	

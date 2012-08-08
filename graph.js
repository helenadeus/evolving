/**
 * @author Helena
 */
var graph = {};

graph.buildDiagram = function (){
		data.datesScope = $.unique(data.allRulesDays.concat(data.allStatsDays)).sort();
		data.countRulesSortedByDate = [];
		data.countStatsSortedByDate = [];
		for (var v=0; v < data.datesScope.length; v++) {
			var date = data.datesScope[v];
			//acconting for days when there were no rules or not items added 
			if(typeof(data.countRules[date])=='undefined'){
				data.countRules[date] = 0;
			}
			data.countRulesSortedByDate.push(data.countRules[date])
			if(typeof(data.createdStatementsItems[date])=='undefined'){
				data.createdStatementsItems[date] = 0;
			}
			data.countStatsSortedByDate.push(data.createdStatementsItems[date]);
		}
		
		
		//var radar = new RGraph.Radar('radar1', [7,6,6,7,8,6,7,7,6,6], [4,5,6,10,4,3,5,4,6,5], [4,3,5,7,6,5,3,2,4,5]);
		var radar = new RGraph.Radar('radar1', data.countRulesSortedByDate, data.countStatsSortedByDate);
            radar.Set('chart.strokestyle', 'black');
            radar.Set('chart.colors.alpha', 0.3);
            radar.Set('chart.colors', ['red', 'green', 'yellow']);
            
            if (!RGraph.isOld()) {
                radar.Set('chart.tooltips', [
                                              'Pete','Lou','Jim','Jack','Fred','Jo','Lou','Freda','Pete','Rick',
                                              'Pete','Lou','Jim','Jack','Fred','Jo','Lou','Freda','Pete','Rick',
                                              'Pete','Lou','Jim','Jack','Fred','Jo','Lou','Freda','Pete','Rick'
                                             ]);
            }

            radar.Set('chart.key', ['Rules','Statements']);
            radar.Set('chart.key.position', 'graph');
            radar.Set('chart.labels', data.datesScope);
            radar.Set('chart.gutter.top', 35);
            radar.Set('chart.accumulative', true);
            radar.Set('chart.labels.axes', '');
            radar.Set('chart.axes.color', 'transparent');
            //radar.Set('chart.background.circles.spacing', 25);
            radar.Draw();
            console.log('worky?');
		
}
	

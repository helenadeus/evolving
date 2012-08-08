/**
 * @author Helena
 */

var s3db = {};
data = {};
data.getListDays = function (){
	data.dailyActions = {};
	data.allRulesDays = [];
	namesNodes = s3db.rules.map( function (a) { return a.object } );
	idsNodes = s3db.rules.map( function (a) { return a.rule_id } );
	combinedIdNames = {};
	for (var i=0; i < idsNodes.length; i++) {
	  combinedIdNames[idsNodes[i]] = namesNodes[i];
	};
	
	//captue all the dates where actions occurred and all the actions
	var datesLog = s3db.rulelog.map(  function (a) { return a.action_timestamp.substr(0,10) }  );
	var actionsLog = s3db.rulelog.map(  function (a) { return a.action }  );
	var idsLog = s3db.rulelog.map(  function (a) { return a.rule_id }  );
	
	
	//find create and delete actions per day
	datesLog.map ( function (date,i) {
		if(typeof(data.dailyActions[date])=='undefined'){
			data.dailyActions[date] = {created:[], changed: [], deleted: []};
			data.allRulesDays.push(date);
		}
			  	
		if(actionsLog[i] == 'create') {
			data.dailyActions[date].created.push(idsLog[i]);

		} else if(actionsLog[i] == 'edit') {
			data.dailyActions[date].changed.push(idsLog[i]);
		} else if(actionsLog[i] == 'delete') {
			data.dailyActions[date].deleted.push(idsLog[i]);
		}
	
	} ) 
	
	
	
}

data.rebuildOntologies = function (){
	//a day ontollogy is the set of rules created before or on this day minus the rules deleted before or on this day
	data.dayOntology = {};var allCreatedBefore = [];
	data.countRules = {};
	var allDeletedBefore = [];
	for(var day in data.dailyActions){
		//intersept all allcreted before this day 
		var allCreatedBefore = $.merge(allCreatedBefore, data.dailyActions[day].created);
		var allDeletedBefore = $.merge(allDeletedBefore, data.dailyActions[day].deleted);
		data.dayOntology[day] = allCreatedBefore.diff(allDeletedBefore);
		data.countRules[day] = data.dayOntology[day].length;
	}
	
	
}

data.rollback = function () {
	
	
	
	//an ontology in a day is the combination of all the ruules that existed before that day minus the ones that were deleted
	//will assume the ontology remained the same in the intervals betwen the existing days
	data.getListDays();
	data.rebuildOntologies();
	
	//now a bit of a hack because the rulelog logs collections via "hasUID" rules; need to match that to a collection ID
	s3db.C2R_lookup = {};s3db.R2C_lookup = {};
	for (var r in s3db.rulelog){
		if(s3db.rulelog[r].old_object=="UID"){
			for (var c in s3db.collections){
				if (s3db.collections[c].name==s3db.rulelog[r].old_subject){
					s3db.C2R_lookup[s3db.collections[c].id] = s3db.rulelog[r].rule_id;
					s3db.R2C_lookup[s3db.rulelog[r].rule_id] = s3db.collections[c].id;
				}
			}
		}
	}
	
	if(s3db.getData){
			s3db.callItemsAndStatements = 0;
			s3db.getItems();
			//queriable rules also include deleted rules
			s3db.getStatements();
	}
	
	
}

data.countEntries = function () {
	
	if(s3db.callItemsAndStatements==2){
		//we are now ready to count entries per day
		//Count for statements; this code can be made cleaner but I'm not feeling very inspired today
		
		data.createdStatements = {};data.statementsCreatedDate = [];data.statementsDatePerRule = {};
		for (var rid in s3db.statements){
			data.statementsDatePerRule[rid] = {}
			var s_crated_by_rule = s3db.statements[rid].map( function (s){ return s.created_on.substr(0,10);})
			s_crated_by_rule.map( function (date) {
				if(typeof(data.statementsDatePerRule[rid][date])=='undefined'){
					data.statementsDatePerRule[rid][date] = 0
				}
				data.statementsDatePerRule[rid][date]++;
				
				if(typeof(data.createdStatements[date])=='undefined'){
					data.createdStatements[date]=0;
				}
				data.createdStatements[date]++;
			})
			data.statementsCreatedDate = data.statementsCreatedDate.concat(s_crated_by_rule);
		}
		
		//for items, we first need to look at the matched between the hasUID rule and the entity
		data.createdItems = {};data.itemsCreatedDate = [];data.itemsDatePerRule = {};
		for (var cid in s3db.items){
			
			data.itemsDatePerRule[cid] = {}
			var s_crated_by_collection = s3db.items[cid].map( function (s){ return s.created_on.substr(0,10);})
			s_crated_by_collection.map( function (date) {
				if(typeof(data.itemsDatePerRule[cid][date])=='undefined'){
					data.itemsDatePerRule[cid][date] = 0
				}
				data.itemsDatePerRule[cid][date]++;
				
				if(typeof(data.createdItems[date])=='undefined'){
					data.createdItems[date]=0;
				}
				data.createdItems[date]++;
			})
			data.itemsCreatedDate = data.itemsCreatedDate.concat(s_crated_by_collection);
		}
	var allStatItemsDates = $.unique(data.itemsCreatedDate.concat(data.statementsCreatedDate));
	data.allStatsDays = allStatItemsDates;
	//now, merge the items with the statements as if the items themselves were statements
	data.createdStatementsItems = {};
	for(var i in allStatItemsDates){
		var date = allStatItemsDates[i];
		if(typeof(data.createdItems[date])=='undefined'){
			data.createdItems[date] = 0;
		}
		if(typeof(data.createdStatements[date])=='undefined'){
			data.createdStatements[date] = 0;
		}
		data.createdStatementsItems[date]=data.createdStatements[date] + data.createdItems[date];
	}
	
	//ready to move on
	graph.buildDiagram();
	}
	
	
}

s3db.completedCall = 0;
s3db.simultCalls = 3;
s3db.getRules = function (x){
	
	var collectioncall = s3db.login.url+'S3QL.php?key='+s3db.login.key+'&query=<S3QL><select>*</select><from>collections</from><where><project_id>'+s3db.login.project_id+'</project_id></where></S3QL>';
	$.getJSON(collectioncall+'&format=json&callback=?', function (collections) { 
		s3db.collections = collections; 
		s3db.completedCall++;
		if(s3db.completedCall==s3db.simultCalls){
			data.rollback();
		}
			
	})
	
	var rulecall = s3db.login.url+'S3QL.php?key='+s3db.login.key+'&query=<S3QL><select>rule_id,subject,verb,object,subject_id,verb_id,object_id,created_on,modified_on</select><from>rules</from><where><project_id>'+s3db.login.project_id+'</project_id></where></S3QL>';
	$.getJSON(rulecall+'&format=json&callback=?', function (rules) { 
		s3db.rules = rules; 
		s3db.completedCall++;
		if(s3db.completedCall==s3db.simultCalls){
			data.rollback();
		}
			
	})
	
	var rulelog = s3db.login.url+'S3QL.php?key='+s3db.login.key+'&query=<S3QL><select>*</select><from>rulelog</from><where><project_id>'+s3db.login.project_id+'</project_id></where></S3QL>';
	
	$.getJSON(rulelog+'&format=json&callback=?', function (rulelog) { 
		s3db.rulelog = rulelog; 
		s3db.completedCall++;
		if(s3db.completedCall==s3db.simultCalls){
			data.rollback();
		}
			
	})

}

s3db.getStatements = function (){
	//retrieving statements per rule; some log rules (the has UID ones) require gathering items as well; so we gather all items
	//for collecting items
	s3db.completedStatsCall = 0;
	s3db.simultStatsCalls = s3db.collections.length;
	s3db.statements = {};
	
	s3db.rules.map( function (a) {
		var statscall = s3db.login.url+'S3QL.php?key='+s3db.login.key+'&query=<S3QL><select>*</select><from>statements</from><where><rule_id>'+a.rule_id+'</rule_id></where></S3QL>';
		
		
	$.getJSON(statscall+'&format=json&callback=?', function (stats) { 
		
		ridguess = stats[0].rule_id;
		s3db.statements[ridguess] = stats;
		s3db.completedStatsCall++;
		if(s3db.completedStatsCall==s3db.simultStatsCalls){
			s3db.callItemsAndStatements++
			data.countEntries();
		}
			
	})
		
		
		
	})
}

s3db.getItems = function (){
	//for collecting items
	s3db.completedItemsCall = 0;
	s3db.simultItemsCalls = s3db.collections.length;
	s3db.items = {};
	
	s3db.collections.map( function (a) {
		var itemscall = s3db.login.url+'S3QL.php?key='+s3db.login.key+'&query=<S3QL><select>*</select><from>items</from><where><collection_id>'+a.collection_id+'</collection_id></where></S3QL>';
		
		
	$.getJSON(itemscall+'&format=json&callback=?', function (items) { 
		
		cidguess = items[0].collection_id;
		s3db.items[cidguess] = items;
		s3db.completedItemsCall++;
		if(s3db.completedItemsCall==s3db.simultItemsCalls){
			s3db.callItemsAndStatements++
			data.countEntries();
		}
			
	})
		
		
		
	})
	
}

$(document).ready(function() {
 	
 	s3db.login = {'url':'http://uab.s3db.org/s3db/', 'key':'mudamseostempos','project_id':'457'};
 	s3db.getData = 1;
	s3db.getRules();
	
});

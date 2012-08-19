/**
 * @author Helena
 */

var s3db = {
	//to invoke rules + collections and then statement + items sequencially. simply fill the s3db structur and invoke s3db.getData(): s3db.login = {'url':'http://uab.s3db.org/s3db/', 'key':'mudamseostempos','project_id':'457'}; s3db.getData()
	completedCall : 0,
	simultCalls : 3,
	getData : function (x){
	
	var collectioncall = s3db.login.url+'S3QL.php?key='+s3db.login.key+'&query=<S3QL><select>*</select><from>collections</from><where><project_id>'+s3db.login.project_id+'</project_id></where></S3QL>';
	$.getJSON(collectioncall+'&format=json&callback=?', function (collections) { 
		s3db.collections = collections; 
		s3db.completedCall++;
		if(s3db.completedCall==s3db.simultCalls){
			dataactions.rollback();
			if(s3db.retrieveDataTrigger){
					s3db.callItemsAndStatements = 0;
					s3db.getItems();
					//queriable rules also include deleted rules
					s3db.getStatements();
			}
		}
			
	})
	
	var rulecall = s3db.login.url+'S3QL.php?key='+s3db.login.key+'&query=<S3QL><select>rule_id,subject,verb,object,subject_id,verb_id,object_id,created_on,modified_on</select><from>rules</from><where><project_id>'+s3db.login.project_id+'</project_id></where></S3QL>';
	$.getJSON(rulecall+'&format=json&callback=?', function (rules) { 
		s3db.rules = rules; 
		s3db.completedCall++;
		if(s3db.completedCall==s3db.simultCalls){
			dataactions.rollback();
			if(s3db.retrieveDataTrigger){
					s3db.callItemsAndStatements = 0;
					s3db.getItems();
					//queriable rules also include deleted rules
					s3db.getStatements();
			}
		}
			
	})
	
	var rulelog = s3db.login.url+'S3QL.php?key='+s3db.login.key+'&query=<S3QL><select>*</select><from>rulelog</from><where><project_id>'+s3db.login.project_id+'</project_id></where></S3QL>';
	
	$.getJSON(rulelog+'&format=json&callback=?', function (rulelog) { 
		s3db.rulelog = rulelog; 
		s3db.completedCall++;
		if(s3db.completedCall==s3db.simultCalls){
			dataactions.rollback();
		}
			
	})

},
	getStatements : function (){
	//retrieving statements per rule; some log rules (the has UID ones) require gathering items as well; so we gather all items
	//for collecting items
	s3db.completedStatsCall = 0;
	s3db.simultStatsCalls = s3db.rules.length;
	s3db.statements = {};
	
	s3db.rules.map( function (a) {
		var statscall = s3db.login.url+'S3QL.php?key='+s3db.login.key+'&query=<S3QL><select>*</select><from>statements</from><where><rule_id>'+a.rule_id+'</rule_id></where></S3QL>';
		
		
		$.getJSON(statscall+'&format=json&callback=?', function (stats) { 
			
			if(typeof(stats[0])!='undefined'){
			ridguess = stats[0].rule_id;
			
			s3db.statements[ridguess] = stats;
			}
			s3db.completedStatsCall++;
			if(s3db.completedStatsCall==s3db.simultStatsCalls){
				s3db.callItemsAndStatements++
				dataactions.countEntries();
			}
				
		})
			
			
			
		})
	},
	
	getItems : function (){
	//for collecting items
	s3db.completedItemsCall = 0;
	s3db.simultItemsCalls = s3db.collections.length;
	s3db.items = {};
	
	s3db.collections.map( function (a) {
		var itemscall = s3db.login.url+'S3QL.php?key='+s3db.login.key+'&query=<S3QL><select>*</select><from>items</from><where><collection_id>'+a.collection_id+'</collection_id></where></S3QL>';
		
		
	$.getJSON(itemscall+'&format=json&callback=?', function (items) { 
		if(typeof(items[0])!='undefined'){
		cidguess = items[0].collection_id;
		s3db.items[cidguess] = items;
		}
		s3db.completedItemsCall++;
		if(s3db.completedItemsCall==s3db.simultItemsCalls){
			s3db.callItemsAndStatements++
			dataactions.countEntries();
		}
			
	})
		
		
		
	})
	
}


}

var data = {};dataactions = {};

dataactions.getListDays = function (){
	data.dailyActions = {};
	data.allRulesDays = [];
	data.rulesPerDay = {};

	/*namesNodes = s3db.rules.map( function (a) { return a.object } );
	idsNodes = s3db.rules.map( function (a) { return a.rule_id } );
	combinedIdNames = {};
	for (var i=0; i < idsNodes.length; i++) {
	  combinedIdNames[idsNodes[i]] = namesNodes[i];
	};
	*/
	
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
			  	
		if($.trim(actionsLog[i]) == 'create') {
			data.dailyActions[date].created.push(idsLog[i]);
		

		} else if($.trim(actionsLog[i]) == 'edit') {
			data.dailyActions[date].changed.push(idsLog[i]);
		} else if($.trim(actionsLog[i]) == 'delete') {
			data.dailyActions[date].deleted.push(idsLog[i]);
				
			//whenever a rule is deleted, we lose track of its description, so its description must be collected the the rulelog
			
		}
		//if not rules were added, but one was deleted, this should be -1; will make sense for comulative display
		data.rulesPerDay[date] = data.dailyActions[date].created.length-data.dailyActions[date].deleted.length
	
	} ) ;
	
	
	
}

dataactions.rebuildOntologies = function (){
	//a day ontollogy is the set of rules created before or on this day minus the rules deleted before or on this day
	data.dayOntology = {};var allCreatedBefore = [];data.dayOntologyEdges = {};data.dayOntologyNodes ={};
	data.countRules = {};
	var allDeletedBefore = [];
	for(var day in data.dailyActions){
		//intersept all allcreted before this day 
		var allCreatedBefore = $.merge(allCreatedBefore, data.dailyActions[day].created);
		var allDeletedBefore = $.merge(allDeletedBefore, data.dailyActions[day].deleted);
		data.dayOntology[day] = allCreatedBefore.diff(allDeletedBefore);
		data.countRules[day] = data.dayOntology[day].length;
		
		//all edges and nodes for the day
		data.dayOntologyEdges[day] = data.dayOntology[day].map ( function (rule) {
			var ind = data.alledges_ind.indexOf(rule);
			if(ind!=-1){
				return data.alledges[ind];
			}
			
		})
		data.dayOntologyEdges[day] = data.dayOntologyEdges[day].clean();
		
		
	}
	
	
	
	
	
}

dataactions.ruleEdges = function (){
	
	data.alledges = s3db.rules.map ( function (data) { return {'rule_id': data.rule_id, 'source':data.subject, 'sink':data.object, 'label':data.verb };});
	data.alledges_ind = s3db.rules.map(function (data){return data.rule_id})
	//complete alledges with stuff deleted
	s3db.rulelog.map ( function (log)
	{
		if($.trim(log.action) == 'delete' || log.old_object=='UID'){
			if(data.alledges_ind.indexOf(log.rule_id)==-1){
				data.alledges.push( {'rule_id': log.rule_id, 'source':log.old_subject, 'sink':log.old_object, 'label':log.old_verb })
				data.alledges_ind.push(log.rule_id)
			}
		}
		
	}
	)
	
	//var allsources = data.alledges.map ( function (data) { return data.source; })
	//var allsinks = data.alledges.map ( function (data) { return data.sink} );
	//data.allnodes = $.unique(allsources.concat(allsinks));
	
}

dataactions.rollback = function () {
	
	
	
	//an ontology in a day is the combination of all the ruules that existed before that day minus the ones that were deleted
	//will assume the ontology remained the same in the intervals betwen the existing days
	dataactions.ruleEdges();
	dataactions.getListDays();
	dataactions.rebuildOntologies();
	
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
	
	if(s3db.retrieveDataTrigger){
			s3db.callItemsAndStatements = 0;
			s3db.getItems();
			//queriable rules also include deleted rules
			s3db.getStatements();
	}
	
	
}

dataactions.countEntries = function () {
	
	
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
			
			data.itemsDatePerRule[cid] = {};
			var rid = s3db.C2R_lookup[cid];data.statementsDatePerRule[rid] = {};
			var s_crated_by_collection = s3db.items[cid].map( function (s){ return s.created_on.substr(0,10);})
			s_crated_by_collection.map( function (date) {
				if(typeof(data.itemsDatePerRule[cid][date])=='undefined'){
					data.itemsDatePerRule[cid][date] = 0;
					data.statementsDatePerRule[rid][date] = 0;
				}
				data.itemsDatePerRule[cid][date]++;
				data.statementsDatePerRule[rid][date]++;
				
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
	store = {}; store[s3db.login.url+"&key="+s3db.login.key+"&project_id="+s3db.login.project_id] = {'s3db':JSON.stringify(s3db), 'data':JSON.stringify(data)}; 
	localStorage.evolve = JSON.stringify(store);
	
	graph.buildRadial();
	graph.drawTopology();
	}
	
	
}



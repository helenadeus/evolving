/**
 * @author Helena
 */
$(document).ready(function() {
 	
 	var x = {'url':'http://uab.s3db.org/s3db/', 'key':'mudamseostempos','project_id':'457'};
	s3db.getRules(x);
});
s3db = {};
s3db.completedCall = 0;
s3db.simultCalls = 3;
s3db.getRules = function (x){
	
	var collectioncall = x.url+'S3QL.php?key='+x.key+'&query=<S3QL><select>*</select><from>collections</from><where><project_id>'+x.project_id+'</project_id></where></S3QL>';
	$.getJSON(collectioncall+'&format=json&callback=?', function (collections) { 
		s3db.collections = collections; 
		s3db.completedCall++;
		if(s3db.completedCall==s3db.simultCalls){
			rollback();
		}
			
	})
	
	var rulecall = x.url+'S3QL.php?key='+x.key+'&query=<S3QL><select>rule_id,subject,verb,object,subject_id,verb_id,object_id,created_on,modified_on</select><from>rules</from><where><project_id>'+x.project_id+'</project_id></where></S3QL>';
	$.getJSON(rulecall+'&format=json&callback=?', function (rules) { 
		s3db.rules = rules; 
		s3db.completedCall++;
		if(s3db.completedCall==s3db.simultCalls){
			getListDays();
			rollback();
		}
			
	})
	
	var rulelog = x.url+'S3QL.php?key='+x.key+'&query=<S3QL><select>*</select><from>rulelog</from><where><project_id>'+x.project_id+'</project_id></where></S3QL>';
	
	$.getJSON(rulelog+'&format=json&callback=?', function (rulelog) { 
		s3db.rulelog = rulelog; 
		s3db.completedCall++;
		if(s3db.completedCall==s3db.simultCalls){
			getListDays();
			rollback();
		}
			
	})

}
rollback = function () {
	//an ontology in a day is the combination of all the ruules that existed before that day minus the ones that were deleted
	//will assume the ontology remained the same in the intervals betwen the existing days
	getListDays();
}
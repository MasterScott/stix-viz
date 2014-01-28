/*
 * Copyright (c) 2013 ? The MITRE Corporation
 * All rights reserved. See LICENSE.txt for complete terms.
 * 
 * This file contains the functionality for extracting time related data specified in the xml
 * files loaded.  The top level function is generateTimelineJson(inputXMLFiles)
 * 
 * Json is created representing time related data as either single points (instances) or time
 * ranges with a start and end time.   This is passed to displayTimeline(json) for display in STIXViz.
 * 
 */

//indiObjs are Sightings with timestamps
function getIndicatorNodes(indiObjs) {
	var indiNodes = [];
	var indiId = "";
	var node = {};
	$(indiObjs).each(function (index, indi) {
		node = {'type':'Indicator-Sighting'};
		parentIndi = $(indi).parent();
		indiId = getObjIdStr(parentIndi);
		node['parentObjId'] = indiId;
		node['description'] = getBestIndicatorName(parentIndi);
		node['timeRange'] = false;
		node['start'] = $(indi).attr('timestamp');
		indiNodes.push(node);
	});
	return indiNodes;
}

// return description string for incident:Course_Of_Action
function getCOADescription(coaTaken) {
	desc = "";
	if (coaTaken != null) {
		var coaType = xpFindSingle('./coa:Type', coaTaken);
		if (coaType != null) {
			desc = $(coaType).text();
		}
		var coaDescription = xpFindSingle('./coa:Description', coaTaken);
		if (coaDescription != null) {
			if (desc.length > 0) {
				desc = desc + ": " + $(coaDescription).text();
			}
			else {
				desc = $(coaDescription).Text();
			}
		}
	}
	return desc;
}

//incident objs are all incidents - check to see if have time, coataken
function getIncidentNodes(incidentObjs) {
	var incidentNodes = [];
	var incidentId = "";
	var node = {};
	var timeObj = null;
	var timeTypeObj = null;
	var coaTakenTime = null;
	var startTime = null;
	var endTime = null;
	$(incidentObjs).each(function (index, incident) {
		incidentId = getObjIdStr(incident);
		timeObj = xpFindSingle('./incident:Time', incident);
		if (timeObj != null) {
			node = {}
			node["parentObjId"] = incidentId;
			node["description"] = getBestIncidentName(incident);
			node['timeRange'] = false;
			//timeTypeObj = xpFindSingle('./incident:First_Malicious_Action', timeObj);
			// there are many different time types: First_Malicious_Action, Initial_Compromise, First_Data_Exfiltration,  Incident_Discovery, Incident_Opened, Containment_Achieved,        
			//		     Restoration_Achieved, Incident_Reported, Incident_Closed
			timeTypeObj = timeObj.firstElementChild;
			if (timeTypeObj != null) {
				//node['type'] = 'Incident-First-Malicious-Action';
				node['type'] = 'Incident-' + timeTypeObj.localName;
				node['start'] = $(timeTypeObj).text();
				incidentNodes.push(node);
			}
			
		}
		coaTakenTime = xpFindSingle('./incident:COA_Taken/incident:Time', incident);
		if (coaTakenTime != null) {
			node = {}
			node["parentObjId"] = incidentId;
			var coaTaken = xpFindSingle('./incident:COA_Taken/incident:Course_Of_Action', incident);
			node["description"] = getCOADescription(coaTaken);
			node['timeRange'] = true;
			node['type'] = 'Incident-COATaken';
			startTime = xpFindSingle('./incident:Start', coaTakenTime);
			if (startTime != null) {
				node['start'] = $(startTime).text();
			}
			endTime = xpFindSingle('./incident:End', coaTakenTime);
			if (endTime != null) {
				node['end'] = $(endTime).text();
			}
			incidentNodes.push(node);
		}

	});
	return incidentNodes;
}

function createTimelineJson(incidentObjs, indiObjs) {
 var timelineJson = [];
 $.merge(timelineJson, getIncidentNodes(incidentObjs));
 $.merge(timelineJson, getIndicatorNodes(indiObjs));
 return timelineJson;
}

var doc = null;


function generateTimelineJson(inputXMLFiles,callback) {

	var incidentObjs = [];
	var indiObjs = [];

	var timeNodes = [];
	
	var reportName = $.map(inputXMLFiles,function (f) {
		return f.name;
	}).join('\n');
	
	function readFile(file) {
	    var reader = new FileReader();
	    var deferred = $.Deferred();
	 
	    reader.onload = function(event) {
	    	
	        var xml = new DOMParser().parseFromString(this.result, "text/xml"); 

	        // global copy of xml to use for searching via xpFind
	        doc = xml;
	        
	        // first collect top level components from all files
            // ets are in stixCommon, observables are in cybox, other top level objs are in stix
            $.merge(incidentObjs, xpFind('.//stix:Incidents/stix:Incident', xml));  // get all incident objs
            $.merge(indiObjs, xpFind('.//stix:Indicators/stix:Indicator/indicator:Sightings/indicator:Sighting[@timestamp]', xml));

	        
	        deferred.resolve();
	    };
	 
	    reader.onerror = function() {
	        deferred.reject(this);
	    };
	 
	    reader.readAsText(file);
	 
	    return deferred.promise();
	}
	
	// Create a deferred object for each input file
	var deferreds = $.map(inputXMLFiles, function (f) {
		return readFile(f);
	});
	
	// When all of the files have been read, this will happen
	$.when.apply(null, deferreds)
		.then(
			function () {
                
                // done collecting from files, start processing objects
				jsonObj = createTimelineJson(incidentObjs, indiObjs);
                
            	// displays Json to web page for debugging
                //$('#jsonOutput').text(JSON.stringify(jsonObj, null, 2));  
                
                // display the tree
                callback(JSON.stringify(jsonObj, null, 2));
		})
		.fail(function (f) { 
			console.log("Error reading input file: " + f.name);
		});
	
}

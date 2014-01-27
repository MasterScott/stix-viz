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
		indiId = getObjIdStr($(indi).parent());
		node['label'] = indiId;
		node['timeRange'] = false;
		node['start'] = $(indi).attr('timestamp');
		indiNodes.push(node);
	});
	return indiNodes;
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
			node["label"] = incidentId;
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
			node["label"] = incidentId;
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


function generateTimelineJson(inputXMLFiles) {

	var incidentObjs = [];
	var indiObjs = [];

	var timeNodes = [];
	
	var numFiles = 0;
	var reportName = "";

	$(inputXMLFiles).each(function (index, f) {
                var xml = null;
                var reader = new FileReader();
                reader.onload = (function(theFile) {
                        return function(e) {
                        	// top node name in tree is list of filenames
            				if (numFiles == 0) {
            					reportName = "Timeline for " + f.name;
            				}
            				else {
            					reportName = topNodeName + "\n" + f.name;
            				}
                            xml = new DOMParser().parseFromString(this.result, "text/xml"); 
                            addXmlDoc(theFile);  // adds the new XML file to the drop down menu in the UI
                            // global copy of xml to use for searching via xpFind
                            doc = xml;
                            
                            // first collect top level components from all files
                            // ets are in stixCommon, observables are in cybox, other top level objs are in stix
                            $.merge(incidentObjs, xpFind('.//stix:Incidents/stix:Incident', xml));  // get all incident objs
                            $.merge(indiObjs, xpFind('.//stix:Indicators/stix:Indicator/indicator:Sightings/indicator:Sighting[@timestamp]', xml));

                            numFiles++;
                            
                            if (numFiles == inputXMLFiles.length) {  // finished last file
                   
                            	jsonObj = createTimelineJson(incidentObjs, indiObjs);
                                
                            	// displays Json to web page for debugging
                                //$('#jsonOutput').text(JSON.stringify(jsonObj, null, 2));  
                                
                                // display the tree
                                displayTimelineJSON(JSON.stringify(jsonObj, null, 2));
                            }
                        };
                    }) (f);
                reader.readAsText(f);
	    });
}

(function(window){
  
  document.getElementById('afhcan-cerner-version').innerHTML = 'Version: VPR SMART FHIR';
  
  // Hide the inline alert whenever the window is clicked on.
	window.onclick = function(event) {
		if (event.target.id !== 'inlineAlertDiv' && event.target.id !== 'alertTextSpan' && event.target.id !== 'alertDescriptionSpan') {
	    	$('#inlineAlertDiv').hide();
	    }
	}
  
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      console.log(smart);
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                      }
                    }
                  });

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function(patient, obv) {
          console.log(patient);
          /*var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;
          var dob = new Date(patient.birthDate);
          var day = dob.getDate();
          var monthIndex = dob.getMonth() + 1;
          var year = dob.getFullYear();

          var dobStr = monthIndex + '/' + day + '/' + year;
          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');*/

          var p = defaultPatient();
          //p.birthdate = dobStr;
          //p.gender = gender;
          //p.fname = fname;
          //p.lname = lname;
          //p.age = parseInt(calculateAge(dob));
          //p.height = getQuantityValueAndUnit(height[0]);

          /*if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);*/

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };
  
  function getLink() {
	getIndirectRoomUrl(copyLinkToClipboardAndReport);
}
function copyLinkToClipboardAndReport(link) {
	copyToClipboard('Click the following link to join your virtual patient room:\r\n' + link);
	document.getElementById('alertDescriptionSpan').innerHTML = 'Invitation link has been copied to the clipboard.  Use CTRL-V to paste into a message.';
	document.getElementById('alertTextSpan').innerHTML = link;
	$('#inlineAlertDiv').slideDown();
}

function getLinkAndLaunch() {
	getIndirectRoomUrl(launchLink);
}
function launchLink(link) {
	APPLINK(100, link, '');
}

function getIndirectRoomUrl(callback) {
	var sha256 = new Hashes.SHA256;
	jQuery.support.cors = true;
	try {
		$.ajax({
			url: override.coreUrl + "api/Vidyo/PatientRoomUrl/" + sha256.hex('' + patientId) + "/" + ehrId + "/" + cernerUserId,
			beforeSend: function(xhr){            
					var hashStr = "Basic " + Base64.encode(ehrId + ":" + Base64.decode(ehrPassword));
					xhr.setRequestHeader('Authorization', hashStr);
			},
			type: "GET",
			success: function(link){
				if (link.length == 0) {
					alert("Core failed to produce a link!");
					return;
				}
				callback(link);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Failed to get guest room link from Core. Error: " + errorThrown);
			}	
		});
	}
	catch(e)
	{
		console.log("Connection to core failed :" + e);
	}
  
  function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        return clipboardData.setData("Text", text); 
    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}
  
  

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      age: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
    };
  }

  window.drawVisualization = function(p) {
    $('#container').show();
    $('#loading').hide();
    /*$('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#age').html(p.age);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);*/
  };

})(window);

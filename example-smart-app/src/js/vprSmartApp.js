(function (window) {
    document.getElementById('afhcan-cerner-version').innerHTML = 'Version: VPR SMART FHIR';

    var cernerUserId = '';
    var patientId = '';
    var ehrId = '';
    var newWindow = null;

    // Hide the inline alert whenever the window is clicked on.
    window.onclick = function (event) {
        if (event.target.id !== 'inlineAlertDiv' && event.target.id !== 'alertTextSpan' && event.target.id !== 'alertDescriptionSpan') {
            $('#inlineAlertDiv').hide();
        }
    }

    window.extractData = function () {
        var ret = $.Deferred();

        function onError() {
            alert('onError');
            ret.reject();
        }

        function onReady(smart) {
            if (smart.hasOwnProperty('patient')) {
                
                var pt = smart.patient.read();
                //var pt = patient.read();
                
                // NOTE: this should work per specification, but it doesn't...
                // http://docs.smarthealthit.org/clients/javascript/
                // https://groups.google.com/forum/#!searchin/cerner-fhir-developers/smart.user.read()%7Csort:date/cerner-fhir-developers/0LIK-2Af-5s/-D_4tmiiBgAJ
                //var user = smart.user;
                //var ur = smart.user.read();
                
                ehrId = smart.state.client.client_id;

                var currentUserFhirUrl = smart.userId;
                var userIdSections = currentUserFhirUrl.split("/");
                var userType = userIdSections[userIdSections.length - 2];
                var userId = userIdSections[userIdSections.length - 1];
                var ur = smart.api.read({ type: userType, id: userId });
                
                /*var app = smart.patient.api.fetchAll({
                    type: 'Appointment',
                    query: {
                      code: {
                      }
                    }
                  });
                console.log(app)*/

                $.when(pt, ur).fail(onError);
                $.when(pt, ur).done(function (patient, user) {
                    //alert(ap)
                    //
                      /*var gender = patient.gender;
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
                    
                    alert(fname + ' ' + lname);*/
                    //
                    
                    
                    patientId = patient.id;
                    cernerUserId = user.data.id;
                    console.log(patient);
                    console.log(user);
                    
                    ret.resolve();
                });
            } else {
                onError();
            }
        }

        FHIR.oauth2.ready(onReady, onError);
        return ret.promise();
    };

    function copyLinkToClipboardAndReport(link) {
        copyToClipboard('Click the following link to join your virtual patient room:\r\n' + link);
        document.getElementById('alertDescriptionSpan').innerHTML = 'Invitation link has been copied to the clipboard.  Use CTRL-V to paste into a message.';
        document.getElementById('alertTextSpan').innerHTML = link;
        $('#inlineAlertDiv').slideDown();
    }

    function launchLink(link) {
        newWindow.location = link;
        newWindow.focus();
    }

    function getIndirectRoomUrl(callback) {
        var sha256 = new Hashes.SHA256;
        jQuery.support.cors = true;
        try {
            $.ajax({
                url: 'https://afhcan-core-josh.azurewebsites.net/' + "api/Vidyo/PatientRoomUrl/" + sha256.hex('' + patientId) + "/" + ehrId + "/" + cernerUserId,
                type: "GET",
                success: function (link) {
                    if (link.length == 0) {
                        alert("Core failed to produce a link!");
                        return;
                    }
                    callback(link);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert("Failed to get guest room link from Core. Error: " + errorThrown);
                }
            });
        }
        catch (e) {
            console.log("Connection to core failed :" + e);
        }
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

    window.getLink = function () {
        getIndirectRoomUrl(copyLinkToClipboardAndReport);
    };

    window.getLinkAndLaunch = function () {
        newWindow = window.open("", "_blank");
        getIndirectRoomUrl(launchLink);
    };

    window.drawVisualization = function () {
        $('#vprDiv').show();
        $('#loading').hide();
    };
})(window);

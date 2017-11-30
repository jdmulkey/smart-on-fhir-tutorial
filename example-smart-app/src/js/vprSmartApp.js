(function (window) {
    document.getElementById('afhcan-cerner-version').innerHTML = 'Version: VPR SMART FHIR';

    var cernerUserId = '';
    var patientId = '';
    var ehrId = '456';
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
            console.log('Failed to load FHIR resoruce');
            ret.reject();
        }

        function onReady(smart) {
            console.log(smart);
            if (smart.hasOwnProperty('patient')) {
                var patient = smart.patient;
                var pt = patient.read();

                var user = smart.user;
                
                var currentUserFhirUrl = smart.userId;
                var userIdSections = currentUserFhirUrl.split("/");
                var userType = userIdSections[userIdSections.length - 2];
                var userId = userIdSections[userIdSections.length - 1];
                ur = smart.api.read({ type: userType, id: userId });

                $.when(pt, ur).fail(onError);
                $.when(pt, ur).done(function (patient, user) {
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

(function (window) {
    document.getElementById('afhcan-cerner-version').innerHTML = 'Version: VPR SMART FHIR';

    // Hide the inline alert whenever the window is clicked on.
    window.onclick = function (event) {
        if (event.target.id !== 'inlineAlertDiv' && event.target.id !== 'alertTextSpan' && event.target.id !== 'alertDescriptionSpan') {
            $('#inlineAlertDiv').hide();
        }
    }

    window.extractData = function () {
        var ret = $.Deferred();

        function onError() {
            console.log('Loading error', arguments);
            ret.reject();
        }

        function onReady(smart) {
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

                $.when(pt, obv).done(function (patient, obv) {
                    patientId = patient.id;
                    console.log(patient);

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
        var win = window.open(link, '_blank');
        win.focus();
    }

    function getIndirectRoomUrl(callback) {
        console.log(ehrId);
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

    var cernerUserId = '123';
    var patientId = '';
    var ehrId = '456';

    window.getLink = function () {
        getIndirectRoomUrl(copyLinkToClipboardAndReport);
    };

    window.getLinkAndLaunch = function () {
        getIndirectRoomUrl(launchLink);
    };

    window.drawVisualization = function () {
        console.log('drawVisualization');
        $('#vprDiv').show();
        $('#loading').hide();
    };
})(window);

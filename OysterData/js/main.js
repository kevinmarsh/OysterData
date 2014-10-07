/*******************************************************************************
*@license
* Oyster Data by Kevin Marsh 2014
*
* Upload the csv file via an upload button
* Convert the csv file to JSON (in the format of an array of journeys)
    {
        "Journey/Action": "Brixton [London Underground] to Camden Town",
        "Start Time": "17:36",
        "Charge": "2.8",
        "Note": "",
        "Credit": "",
        "End Time": "17:59",
        "Date": "13-Aug-2013",
        "Balance": "9.95"
    }
* Save the journeys in session/local storage
* Process the journeys into routes (Station A to Station B)
* Save the routes in local storage
*
* Show date range of journeys and totals
* fix after midnight bug
* Prevent process session storage from doubling items
*
*******************************************************************************/

$(function () {
    'use strict';

/*******************************************************************************
* Functions
*******************************************************************************/

    function readUpload(uploadedFiles) {
        if ($(uploadedFiles).val().split('.').pop().toLowerCase() !== 'csv') {
            // Trivially check that it is the correct file type
            window.alert('Sorry only CSV files are accepted at this time.');
        }
        if (uploadedFiles.files) {
            $.each(uploadedFiles.files, function (i, file) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var outputJson = processCSV(e.target.result);
                    saveJourneyJson(outputJson);
                };  // End onload()
                reader.readAsText(file);
            });
            processSessionData();
        }  // End if html5 filelist support
    }

    function processCSV(csvData) {
        var headerRow;
        var rows = [];
        $.each(csvData.split('\n'), function (index, row) {
            var currentRow = {};
            if (headerRow === undefined) {
                if (row.indexOf('Date,') === 0) {
                    headerRow = row.toLowerCase().replace(/[^a-z0-9,]/g, '_').replace(/_[a-z]/g, function (x) { return x.slice(1).toUpperCase (); }).split(',');
                }
            } else {
                $.each(row.split(','), function (i, v) {
                    currentRow[headerRow[i]] = v;
                });
                rows.push(currentRow);
            }
        });
        return [headerRow, rows];
    }

    function saveJourneyJson(data) {
        // Save the JSON data in session storage
        var headers = data[0];
        var journeys = data[1];
        var previousJourneys = sessionStorage.getItem('journeys');
        if (!sessionStorage.getItem('journeys') && typeof headers !== 'string') {
            headers = JSON.stringify(headers);
        }
        sessionStorage.setItem('headers', headers);
        if (typeof previousJourneys === 'string') {
            journeys = journeys.concat(JSON.parse(previousJourneys));
        }
        if (typeof journeys !== 'string') {
            journeys = JSON.stringify(uniqueArray(journeys));
        }
        sessionStorage.setItem('journeys', journeys);
    }

    function processSessionData() {
        var journeys = sessionStorage.getItem('journeys');
        if (journeys === null) {
            return false;
        }
        journeys = JSON.parse(journeys);
        var routes = convertJourneysToRoutes(journeys);
        var minJourneys = $('input[name="minjourneys"]').val();
        convertStationsToTable(routes, minJourneys);
        $('#routes').attr('data-sortable', 'data-sortable').removeAttr('data-sortable-initialized');
        Sortable.init();
        $('.processeddata').show();
        $('button.processsessiondata, button.clearsessiondata').prop('disabled', false);
        setAltRow('tbody tr');
    }

    function uniqueArray(array) {
        // Removes duplicates from an array (http://stackoverflow.com/a/1584377/2619847)
        var a = array.concat();
        for (var i = 0; i < a.length; i++) {
            for (var j = i + 1; j < a.length; j++) {
                if (a[i] === a[j])
                    a.splice(j--, 1);
            }
        }
        return a;
    }

    function convertJourneysToRoutes(journeys) {
        // Take the array of individual journeys and convert them to routes with aggregated data
        var routes = {};  // Station name, number of journeys, average cost, average time
        $.each(journeys, function (i, row) {
            var timeDiff;
            var stationName = row.journeyAction;
            if (!stationName || stationName.indexOf('"Topped up') === 0 || stationName.indexOf('"Season ticket bought') === 0) {
                return;
            }
            stationName = stationName.replace(/\"/g, '');
            if (!(stationName in routes)) {
                // Add the station name to the routes
                routes[stationName] = {
                    'unchargedCount': 0,
                    'chargedCount': 0,
                    'charged': 0,
                    'time': 0
                };
            }
            if (row.endTime) {
                var endTime = new Date(row.date + ' ' + row.endTime);
                var startTime = new Date(row.date + ' ' + row.startTime);
                if (startTime > endTime) {
                    // Then the trip began before midnight and ended after
                    endTime = new Date(endTime.valueOf() + 86400000);
                }
                timeDiff = endTime - startTime;
            } else {
                timeDiff = 0;
            }
            routes[stationName].time += timeDiff;
            if (parseFloat(row.charge)) {
                routes[stationName].chargedCount += 1;
                routes[stationName].charged += parseFloat(row.charge);
            } else {
                routes[stationName].unchargedCount += 1;
            }
        });
        return routes;
    }

    function cleanStationName(stationName) {
        // Replaces the superfluous '[London Underground]' or '[London Underground / National Rail]'
        // from the station name and adds it back as a span with that as the title
        return stationName.replace(/ \[([\w\s\/]*)\]/g, '<span title="$1">*</span>');
    }

    function monetaryFormat(value) {
        if (value === '' || value === undefined) {
            return '';
        }
        return '£' + value.toFixed(2);
    }

    function convertStationsToTable(stationData, minJourneys) {
        var $stationList = $('#routes');
        $('#routes tbody').empty();
        // Staion Name | Count | Avg Time | Total Time | Avg Cost | Total Cost
        $.each(stationData, function (station, data) {
            var journeysCount = data.chargedCount + data.unchargedCount;
            if (!minJourneys || journeysCount >= minJourneys) {
                var stationRow = $('<tr/>').addClass('visible').appendTo($stationList);
                var avgTime = (data.time / 1000 / 60 / journeysCount);
                var totalTime = (avgTime * journeysCount);
                var avgCost = data.charged > 0 ? (data.charged / data.chargedCount) : 0;
                var totalCost = data.charged;
                $.each([cleanStationName(station), journeysCount, avgTime.toFixed(2), totalTime.toFixed(2), monetaryFormat(avgCost), monetaryFormat(totalCost)], function (index, value) {
                    $('<td/>').html(value).attr('data-value', value.toString().replace('£', '')).appendTo(stationRow);
                });
            }
        });
    }

    function filter(selector, query) {
        // http://net.tutsplus.com/tutorials/javascript-ajax/using-jquery-to-manipulate-and-filter-data/
        query = $.trim(query); //trim white space
        query = query.replace(/ /gi, '|'); //add OR for regex query

        $(selector).each(function () {
            if ($(this).text().search(new RegExp(query, 'i')) < 0) {
                $(this).removeClass('visible');
            } else {
                $(this).addClass('visible');
            }
        });
        setAltRow(selector);
    }

    function setAltRow(selector) {
        $('.alt').removeClass('alt');
        $(selector + ':visible:even').addClass('alt');
    }

/*******************************************************************************
* Event Handlers
*******************************************************************************/

    $('.uploadcsv').on('click', function () {
        $(this).children('input')[0].click();
    });

    $('input[type="file"]').change(function () {
        readUpload(this);
    });

    $('button.processsessiondata').on('click', processSessionData);

    $('button.clearsessiondata').on('click', function () {
        sessionStorage.clear();
        $(this).prop('disabled', 'disabled');
        $('.processsessiondata').prop('disabled', 'disabled');
        $('.processeddata').hide();
        $('#routes').removeAttr('data-sortable');
        Sortable.init();
    });

    $('#filter').on('keyup', function (event) {
        if (event.keyCode === 27 || $(this).val() === '') {
            // If esc is pressed we want to clear the value of search box
            // and show all rows
            $(this).val('');
            $('tbody tr').addClass('visible');
        } else {
            filter('tbody tr', $(this).val());
        }
    });

    $('label span').on('click', function () {
        // Clear the filter input when the 'x' is clicked
        $(this).siblings('input').val('');
        $('tbody tr').addClass('visible');
        setAltRow('tbody tr');
    });

    $('th').on('click', function () {
        // Add an event handler *after* the columns have been sorted
        setAltRow('tbody tr');
    });

/*******************************************************************************
* Initialize
*******************************************************************************/

    if (sessionStorage.getItem('journeys')) {
        // Load the session storage if there are journeys saved
        processSessionData();
    } else {
        $('button.processsessiondata, button.clearsessiondata').prop('disabled', true);
    }

    if (!/chrom(e|ium)/.test(navigator.userAgent.toLowerCase())) {
        // Show the browser warning
        $('#alertbox').slideDown().text('Dates may be broken in non-Chromium based browsers due to date parsing in Javascript.');
    }

    $('#draggable').draggable({
        revert: 'invalid'
    });

    $('#droppable').droppable({
        hoverClass: 'ui-state-active',
        activeClass: 'ui-state-hover',
        drop: function () {
            if (!$(this).hasClass('ui-state-highlight')) {
                $(this).addClass('ui-state-highlight');
                $('#draggable').addClass('ui-state-dropped').draggable('disable');
                // Load the sample data
                $.get('data/sample_tfl_data.csv', function (data) {
                    var outputJson = processCSV(data);
                    saveJourneyJson(outputJson);
                    processSessionData();
                });
                $(this).parent('.container').slideUp();
            }
        }
    });

});

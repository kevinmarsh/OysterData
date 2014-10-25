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

    function readUpload(files) {
        $.each(files, function (i, file) {
            if (file.type !== 'text/csv') {
                // Trivially check that it is the correct file type
                window.alert('Sorry only CSV files are accepted at this time.');
                return false;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                var journeys = processCSV(e.target.result);
                saveJourneyJson(journeys);
                debouncedProcessSessionData();
            };
            reader.readAsText(file);
        });
    }

    function processCSV(csvData) {
        var headerRow;
        var rows = [];
        $.each($.csv.toArrays(csvData), function (index, row) {
            if (headerRow === undefined) {
                if (row.length && row[0] === 'Date') {
                    // Give the keys proper names
                    headerRow = $.map(row, function (header) {
                        return header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_[a-z]/g, function (x) { return x.slice(1).toUpperCase (); });
                    } );
                }
            } else {
                var currentRow = {};
                $.each(row, function (i, v) {
                    currentRow[headerRow[i]] = v;
                });
                rows.push(currentRow);
            }
        });
        return rows;
    }

    function saveJourneyJson(journeys) {
        // Save the journey JSON data in session storage
        var previousJourneys = sessionStorage.getItem('journeys');
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
        convertStationsToTable(routes);
        var $sorted = $('[data-sorted="true"]');
        if ($sorted.length) {
            // This is a terrible little hack to get Sortable to properly handle data being dynamically added
            ($sorted.next().length ? $sorted.next() : $sorted.prev()).trigger('click');
            $sorted.attr('data-sorted-direction', ($sorted.attr('data-sorted-direction') === 'ascending' ? 'descending' : 'ascending')).trigger('click');
        }
        if ($('.results').is(':hidden') || $('.loaddata').is(':visible')) {
            $('.loaddata').slideUp(function () {
                $('#sampledata').hide();
                $('#uploadcsv').css('width', '100%');
                $('.results').slideDown();
            });
        }
    }

    var debouncedProcessSessionData = $.debounce(200, processSessionData);

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
            if (!stationName || stationName.indexOf('Topped up') === 0 || stationName.indexOf('Season ticket bought') === 0) {
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

    function convertStationsToTable(stationData) {
        var $stationList = $('#routes');
        $('#routes tbody').empty();
        // Staion Name | Count | Avg Time | Total Time | Avg Cost | Total Cost
        $.each(stationData, function (station, data) {
            var journeysCount = data.chargedCount + data.unchargedCount;
            var stationRow = $('<tr/>').addClass('visible').appendTo($stationList);
            var avgTime = (data.time / 1000 / 60 / journeysCount);
            var totalTime = (avgTime * journeysCount);
            var avgCost = data.charged > 0 ? (data.charged / data.chargedCount) : 0;
            var totalCost = data.charged;
            $.each([cleanStationName(station), journeysCount, avgTime.toFixed(2), totalTime.toFixed(2), monetaryFormat(avgCost), monetaryFormat(totalCost)], function (index, value) {
                $('<td/>').html(value).attr('data-value', value.toString().replace('£', '')).appendTo(stationRow);
            });
        });
    }

    function filter(selector, query) {
        // http://net.tutsplus.com/tutorials/javascript-ajax/using-jquery-to-manipulate-and-filter-data/
        query = $.trim(query).replace(/ /gi, '|'); // trim white space and add OR for regex query
        query = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); // escape special chars
        var regex = new RegExp(query, 'i');
        $(selector).each(function () {
            $(this).toggleClass('visible', $(this).find('td:first').text().search(regex) !== -1);
        });
    }

    function setAltRow(selector) {
        $(selector).parent().find('.alt').removeClass('alt');
        $(selector + ':visible:even').addClass('alt');
    }

    function fileDragHandler(event) {
        event.stopPropagation();
        event.preventDefault();
        $(event.target).toggleClass('readytodrop', event.type === 'dragenter');
    }

    function fileDropHandler(event) {
        var files = event.target.files || event.originalEvent.dataTransfer.files;
        readUpload(files);
    }

/*******************************************************************************
* Event Handlers
*******************************************************************************/

    $('#uploadcsv').on('click', function () {
        $(this).children('input')[0].click();
    });

    $('input[type="file"]').on('change', function () {
        readUpload(this.files);
    });

    $('button.processsessiondata').on('click', processSessionData);

    $('button.clearsessiondata').on('click', function () {
        sessionStorage.clear();
        $('#uploadcsv').css('width', '65%');
        $('#sampledata').show();
        $('.loaddata').slideDown();
        $('.results').slideUp();
    });

    $('#sampledata').on('click', function () {
        // Load the sample data
        $.get('data/sample_tfl_data.csv', function (data) {
            var outputJson = processCSV(data);
            saveJourneyJson(outputJson);
            processSessionData();
        }).done(function () {
            // TODO: scroll to the results, disable this button
        });
    });

    $('#filter').on('keyup', function (event) {
        var selector = 'tbody tr';
        if (event.keyCode === 27 || $(this).val() === '') {
            // If esc is pressed we want to clear the value of search box
            // and show all rows
            $(this).val('');
            $(selector).addClass('visible');
        } else {
            filter(selector, $(this).val());
        }
        setAltRow(selector);
    });

    $('label span').on('click', function () {
        // Clear the filter input when the 'x' is clicked
        $(this).siblings('input').val('');
        $('tbody tr').addClass('visible');
        setAltRow('tbody tr');
    });

    $('table').on('change', function () {
        // Add an event handler *after* the columns have been sorted
        setAltRow('tbody tr');
    });

    $('.showloaddata').on('click', function () {
        $('.loaddata').slideDown();
    });

/*******************************************************************************
* Initialize
*******************************************************************************/

    if (sessionStorage.getItem('journeys')) {
        // Load the session storage if there are journeys saved
        processSessionData();
    } else {
        $('.loaddata').show();
    }

    if (!/chrom(e|ium)/.test(navigator.userAgent.toLowerCase())) {
        // Show the browser warning
        $('<div class="alert alert-warning">Dates may be broken in non-Chromium based browsers due to date parsing in Javascript.</div>').insertAfter('.container.page-header');
    }

    if (window.File && window.FileList && window.FileReader) {
        // from sitepoint.com/html5-file-drag-and-drop/
        var xhr = new XMLHttpRequest();
        if (xhr.upload) {
            var $form = $("form").show();
            $form.on('dragover', function (event) {event.preventDefault();});
            $form.on('dragenter dragleave drop', fileDragHandler);
            $form.on('drop', fileDropHandler);

            $('input[name="journeyfiles"]').hide ();
        }
    } else {
        // TODO: hide the 'drag file' bit and just say click to upload
    }

});

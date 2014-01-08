/*******************************************************************************
Oyster Data by Kevin Marsh 2013

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

* Show date range of journeys and totals
* fix after midnight bug
* Prevent process session storage from doubling items

*******************************************************************************/
$(function(){
    "use strict";

    function readUpload(reqFile){
        if($(reqFile).val().split('.').pop().toLowerCase() !== 'csv') {
            // Trivially check that it is the correct file type
            alert('Sorry only CSV files are accepted at this time.');
        }
        if(reqFile.files && reqFile.files[0]){
            var reader = new FileReader();
            reader.onload = function (e) {
                var output_json = processCSV(e.target.result);
                saveJourneyJSON(output_json);
                processSessionData();
            };  // End onload()
            reader.readAsText(reqFile.files[0]);
        }  // End if html5 filelist support
    }

    function processCSV(csvData) {
        var headerRow;
        var rows = [];
        $.each(csvData.split('\n'), function(index, row) {
            var currentRow = {};
            if (index <= 1) {
                headerRow = row.split(',');
            } else {
                $.each(row.split(','), function(i, v) {
                    currentRow[headerRow[i]] = v;
                });
                rows.push(currentRow);
            }
        });
        return [headerRow, rows];
    }

    function saveJourneyJSON (data) {
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
            journeys = JSON.stringify(unique_array(journeys));
        }
        sessionStorage.setItem('journeys', journeys);
    }

    function processSessionData() {
        var journeys = sessionStorage.getItem('journeys');
        if (journeys === null) {
            return false;
        }
        journeys = JSON.parse(journeys);
        var routes = convert_journeys_to_routes(journeys);
        var minJourneys = $('input[name="minjourneys"]').val();
        convert_stations_to_table(routes, minJourneys);
        $('#routes').attr('data-sortable', 'data-sortable').removeAttr('data-sortable-initialized');
        Sortable.init();
        $('.processeddata').show();
        $('button.processsessiondata, button.clearsessiondata').prop('disabled', false);
        set_alt_row('tbody tr');
    }

    function unique_array(array) {
        // Removes duplicates from an array (http://stackoverflow.com/a/1584377/2619847)
        var a = array.concat();
        for(var i=0; i<a.length; ++i) {
            for(var j=i+1; j<a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }
        return a;
    }

    function convert_journeys_to_routes (journeys) {
        // Take the array of individual journeys and convert them to routes with aggregated data
        var routes = {};  // Station name, number of journeys, average cost, average time
        $.each(journeys, function(i, row) {
            if (parseFloat(row['Charge'])) {
                // Skip any ones that are bus journeys or top ups
                var stationname = row['Journey/Action'];
                if (!(stationname in routes)) {
                    // Add the station name to the routes
                    routes[stationname] = {
                        'count': 0,
                        'time': 0,
                        'price': 0
                    };
                }
                var endTime = new Date(row['Date'] + " " + row['End Time']);
                var startTime = new Date(row['Date'] + " " + row['Start Time']);
                if (startTime > endTime) {
                    // Then the trip began before midnight and ended after
                    endTime = new Date(endTime.valueOf() + 86400000);
                }
                var timeDiff = endTime - startTime;
                routes[stationname]['count'] += 1;
                routes[stationname]['time'] += timeDiff;
                routes[stationname]['price'] += parseFloat(row['Charge']);
            }
        });
        return routes;
    }

    function strip_station_name(stationname) {
        // Gets rid of the superfluous "[London Underground]" from the station name
        return stationname.replace(/ \[(\w*\s*\w*)\]/g, '<span title="$1">*</span>')
    }

    function convert_stations_to_table(stationData, minJourneys){
        var $stationList = $('#routes');
        $('#routes tbody').empty();
        // Staion Name | Count | Avg Time | Total Time | Avg Cost | Total Cost
        $.each(stationData, function(station, data) {
            if (!minJourneys || data['count'] >= minJourneys) {
                var stationRow = $('<tr/>').addClass('visible').appendTo($stationList);
                var avg_time = (data['time'] / 1000 / 60 / data['count']).toFixed(2);
                var total_time = (data['time'] / 1000 / 60).toFixed(2);
                var avg_cost = '£' + (data['price'] / data['count']).toFixed(2);
                var total_cost = '£' + (data['price']).toFixed(2);
                $.each([strip_station_name(station), data['count'], avg_time, total_time, avg_cost, total_cost], function(index, value) {
                    $('<td/>').html(value).attr('data-value', value.toString().replace('£', '')).appendTo(stationRow);
                });
            }
        });
    }

    function filter(selector, query) {
        // http://net.tutsplus.com/tutorials/javascript-ajax/using-jquery-to-manipulate-and-filter-data/
        query = $.trim(query); //trim white space
        query = query.replace(/ /gi, '|'); //add OR for regex query

        $(selector).each(function() {
            if ($(this).text().search(new RegExp(query, "i")) < 0) {
                $(this).removeClass('visible');
            } else {
               $(this).addClass('visible');
            }
        });
        set_alt_row(selector);
    }

    function set_alt_row(selector) {
        $('.alt').removeClass('alt');
        $(selector + ':visible:even').addClass('alt');
    }

    $('.uploadcsv').click(function() {
        $(this).children('input')[0].click();
    });

    $('input[type="file"]').change(function () {
        readUpload(this);
    });

    $('button.processsessiondata').on('click', processSessionData);

    $('button.clearsessiondata').on('click', function() {
        sessionStorage.clear();
        $(this).prop('disabled', 'disabled')
        $('.processsessiondata').prop('disabled', 'disabled')
        $('.processeddata').hide();
        $("#routes").removeAttr('data-sortable');
        Sortable.init();
    });

    if (!!sessionStorage.getItem('journeys')) {
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
        drop: function (event, ui) {
            if (!$(this).hasClass('ui-state-highlight')) {
                $(this).addClass('ui-state-highlight');
                $('#draggable').addClass('ui-state-dropped').draggable('disable');
                // Load the sample data
                $.get('../data/sample_journeys.csv', function(data) {
                    var output_json = processCSV(data);
                    saveJourneyJSON(output_json);
                    processSessionData();
                });
                $(this).parent('.container').slideUp();
            }
        }
        // revert: 'invalid'
    });

    $('#filter').on('keyup', function(event) {
        //if esc is pressed or nothing is entered
        if (event.keyCode === 27 || $(this).val() === '') {
            //if esc is pressed we want to clear the value of search box
            $(this).val('');

            //we want each row to be visible because if nothing
            //is entered then all rows are matched.
            $('tbody tr').addClass('visible');
        } else {
            //if there is text, lets filter
            filter('tbody tr', $(this).val());
        }
    });
    $('label span').on('click', function() {
        // Clear the filter input when the 'x' is clicked
        $(this).siblings('input').val('');
        $('tbody tr').addClass('visible');
        set_alt_row('tbody tr');
    });

    $('th').on('click', function(){
        // Add an event handler *after* the columns have been sorted
        set_alt_row('tbody tr');
    });
});

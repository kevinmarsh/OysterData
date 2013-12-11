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
        $('#routes').show();
        // TODO: Do an init sort of the table
        // $('#routes th:nth-child(2)').click();
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
        return stationname.replace(' [London Underground]', '<span title="London Underground">*</span>').replace(' [London Underground / National Rail]', '<span title="London Underground / National Rail">*</span>').replace(' [National Rail]', '<span title="National Rail">*</span>');
    }

    function convert_stations_to_table(stationData, minJourneys){
        var $stationList = $('#routes');
        $('#routes tbody tr').remove();
        $.each(stationData, function(station, data) {
            if (!minJourneys || data['count'] >= minJourneys) {
                var stationRow = $('<tr/>').appendTo($stationList);
                $('<td/>').html(strip_station_name(station)).appendTo(stationRow);
                $('<td/>').text(data['count']).appendTo(stationRow);
                $('<td/>').text((data['time'] / 1000 / 60 / data['count']).toFixed(2)).appendTo(stationRow);
                $('<td/>').text((data['time'] / 1000 / 60).toFixed(2)).appendTo(stationRow);
                $('<td/>').text('£' + (data['price'] / data['count']).toFixed(2)).appendTo(stationRow);
                $('<td/>').text('£' + (data['price']).toFixed(2)).appendTo(stationRow);
            }
        });
        $stationList.trigger('update').trigger('sorton', [[[1,1]]]);
    }

    $('button.upload').click(function() {
        $(this).siblings('input').click();
    });

    $('input[type="file"]').change(function () {
        readUpload(this);
        $('button.processsessiondata, button.clearsessiondata').attr('disabled', false);
    });

    $('button.processsessiondata').on('click', processSessionData);

    $('button.clearsessiondata').on('click', function() {
        sessionStorage.clear();
    });

    if (!!sessionStorage.getItem('journeys')) {
        // Load the session storage if there are journeys saved
        processSessionData();
    } else {
        $('button.processsessiondata, button.clearsessiondata').attr('disabled', true);
    }
});

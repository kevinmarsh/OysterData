function readUpload(reqFile){
    if(reqFile.files && reqFile.files[0]){
        var reader = new FileReader();
        reader.onload = function (e) {
            var output_json = processCSV(e.target.result);
            printJourneyJSON(output_json[1]);
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
    // TODO: check that journeys aren't already set in sessionStorage

    // var journeys = sessionStorage.getItem('journeys');
    // if (journeys) {
    //     journeys = JSON.parse(jsonData);
    // } else {
    //     journeys = [];
    // }
    // journeys += jsonData;
    // sessionStorage.setItem('journeys', JSON.stringify(journeys));
    if (typeof data !== 'string') {
        data = JSON.stringify(data);
    }
    sessionStorage.setItem('journeys', data);
}

function printJourneyJSON (jsonData) {
    var journeys = {};
    var items = [];
    $.each(jsonData, function(row) {
        $.each(jsonData[row], function(key, val) {
            if (key === 'Journey/Action') {
                if (val in journeys) {
                    journeys[val] += 1;
                } else {
                    journeys[val] = 1;
                }
            }
            items.push('<li>' + key + ': ' + val + '</li>');
        });
        items.push('<li>//////////////////////////////////////////////////////////////</li>');
    });
    $('<ul/>', {
        'class': 'my-new-list',
        html: items.join('')
    }).appendTo('body');
}

$('button.upload').click(function() {
    $(this).siblings('input').click();
});

$('input[type="file"]').change(function () {
    readUpload(this);
});


/*******************************************************************************
*******************************************************************************/

function loadSampleData() {
    $.getJSON("../data/oyster-data.json", function(jsonData) {
        // SAMPLE DATA IN JSON
        // Balance: "9.95"
        // Charge: "2.8"
        // Credit: ""
        // Date: "13-Aug-2013"
        // End Time: "17:59"
        // Journey/Action: "Brixton [London Underground] to Camden Town"
        // Note: ""
        // Start Time: "17:36"

        // == {"Journey/Action": "Brixton [London Underground] to Camden Town", "Start Time": "17:36", "Charge": "2.8", "Note": "", "Credit": "", "End Time": "17:59", "Date": "13-Aug-2013", "Balance": "9.95"},

        routes = convert_journeys_to_routes(jsonData);
        convert_stations_to_table(routes, 2);
    });
}

function convert_journeys_to_routes (journeys) {
    // Take the array of individual journeys and convert them to routes with aggregated data
    routes = {};  // Station name, number of journeys, average cost, average time
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
            var timeDiff = new Date(2013, 01, 01, row['End Time'].split(':')[0], row['End Time'].split(':')[1], 0, 0) - new Date(2013, 01, 01, row['Start Time'].split(':')[0], row['Start Time'].split(':')[1], 0, 0);
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
    var stationList = $('<table/>').appendTo('body');
    $('<tr/>').html('<th>Staion Name</th><th>Count</th><th>Avg Time</th><th>Avg Price</th>').appendTo(stationList);
    $.each(stationData, function(station, data) {
        // console.log(station, data);
        if (!minJourneys || data['count'] >= minJourneys) {
            var stationRow = $('<tr/>').appendTo(stationList);
            $('<td/>').html(strip_station_name(station)).appendTo(stationRow);
            $('<td/>').text(data['count']).appendTo(stationRow);
            $('<td/>').text((data['time'] / 1000 / 60 / data['count']).toFixed(2)).appendTo(stationRow);
            $('<td/>').text((data['price'] / data['count']).toFixed(2)).appendTo(stationRow);
        }
    });
}
$('#loadsampledata').on('click', loadSampleData);

/*******************************************************************************
*******************************************************************************/

/*******************************************************************************

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


*******************************************************************************/

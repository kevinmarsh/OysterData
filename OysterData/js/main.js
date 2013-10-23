var reader = new FileReader();

var allJourneys;

function readUpload(reqFile){
    if(reqFile.files && reqFile.files[0]){
        var reader = new FileReader();
        reader.onload = function (e) {
            processCSV(e.target.result);
        };  // End onload()
        reader.readAsText(reqFile.files[0]);
    }  // End if html5 filelist support
}

function processCSV(csvData) {
    var headerRow;
    var journeys = [];
    $.each(csvData.split('\n'), function(index, row) {
        var currentJourney = {}
        if (index <= 1) {
            headerRow = row.split(',')
        } else {
            $.each(row.split(','), function(i, v) {
                currentJourney[headerRow[i]] = v;
            });
            journeys.push(currentJourney);
        }
    });
    console.log(journeys);
    allJourneys = journeys;
    return journeys;
}

// function sortKeys(obj) {
//     var dictKeys = [];
//     for(var key in obj) {
//         if (obj.hasOwnProperty(key)) {
//             dictKeys.push(key);
//         }
//     }
//     var sortedArray = dictKeys.sort();
//     sortedKeys = [];
//     for (var k in sortedArray) {
//         sortedKeys.push(sortedArray[k]);
//     }
//     return sortedKeys;
// }

function parseJourneyJSON (data) {
    var journeys = {};
    var items = [];
    $.each(data, function(row) {
        $.each(data[row], function(key, val) {
            if (key === 'Journey/Action') {
                if (val in journeys) {
                    journeys[val] += 1;
                } else {
                    journeys[val] = 1;
                }
            }
            items.push('<li>' + key + ': ' + val + '</li>');
        });
        items.push('<li></li>');
    });
    $('<ul/>', {
        'class': 'my-new-list',
        html: items.join('')
    }).appendTo('body');
    console.log(journeys);
}

$('button.upload').click(function() {
    $(this).siblings('input').click();
});

$('input[type="file"]').change(function () {
    console.log('something changed!');
    allJourneys = readUpload(this);
    parseJourneyJSON(allJourneys);
});

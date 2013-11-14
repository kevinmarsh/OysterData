var reader = new FileReader();


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

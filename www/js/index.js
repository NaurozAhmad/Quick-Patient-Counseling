/*jslint browser: true*/
/*global $, jQuery, cordova, alert, Blob, FileReader, getPrev, Materialize, update, firstUpdate*/

var logOb = null,
    userNotes = null,
    userNotesObj = [],
    stuff = null,
    newStuff = null,
    oldStuff = null,
    obj = null,
    singleObject = null,
    singleUserNote = null,
    modalOpened = false,
    searchByType = 2,
    pSearch = $('#main-search'),
    sSearch = $('#search-key'),
    nextBatch = 50,
    done = 0;

//============================================ Mutual Functions =================================================

function findByID(id) {
    var deferred = $.Deferred(),
        object = obj,
        l = object.length,
        i;
    for (i = 0; i < l; i = i + 1) {
        if (object[i].drug_id == id) {
            singleObject = object[i];
            break;
        }
    }
    deferred.resolve(singleObject);
    return deferred.promise();
}

function putValue(ul, jsonObject) {
    var i,
        object = null;
    for (i = 0; i < 50; i++) {
        object = jsonObject[i];
        if (searchByType === 1) {
            $(ul).append('<li onclick="onSingleDrug(' + object.drug_id + ')" class="collection-item single-object">' +
                '<a class="result-link" rel="external">' +
                '<span>' + object.drug_brand +
                ' <span style="font-weight: bold" class="title-name">(' +
                object.drug_name + ')</span></span></a></li>');
        } else if (searchByType === 2) {
            $(ul).append('<li onclick="onSingleDrug(' + object.drug_id + ')" class="collection-item single-object">' +
                '<a class="result-link" rel="external">' +
                '<span  style="font-weight: bold">' + object.drug_brand +
                ' <span style="font-weight: normal !important;"  class="title-name">(' +
                object.drug_name + ')</span></span></a></li>');
        }
    }
}

function putDrugs() {
    $('#all-drugs-list').empty();

    var object;
    if (obj !== null) {
        $('.drugsNext').css('display', 'inline-block');
        $('.drugsPrev').css('display', 'inline-block');
        for (var i = done; i < nextBatch; i++) {
            if (i < obj.length) {
                object = obj[i];
                $('#all-drugs-list').append('<li onclick="onSingleDrug(' + object.drug_id + ')" class="collection-item single-object">' +
                    '<a class="result-link" rel="external">' +
                    '<span  style="font-weight: bold">' + object.drug_brand +
                    ' <span style="font-weight: normal !important;"  class="title-name">(' +
                    object.drug_name + ')</span></span></a></li>');
            }
            else {
                break;
            }
        }
        if (nextBatch > obj.length) {
            done = 10000;
        }
        $('.current-drugs').text(done + 1 + ' to ' + nextBatch + " out of " + obj.length);
    }
    else {
        $('#all-drugs-list').append('<li>No drugs yet. Please update.</li>');
        $('.drugsNext').css('display', 'none');
        $('.drugsPrev').css('display', 'none');
    }
}

$('.drugsNext').on('click',function (e) {
    e.preventDefault();
    done = nextBatch;
    if (done > 0) {
        $('.drugsPrev').removeClass('disabled');
        nextBatch = nextBatch + 50;
        putDrugs();
        window.scrollTo(0,0);
    }
    if (nextBatch >= obj.length) {
        $('.drugsNext').addClass('disabled');
    }
});

$('.drugsPrev').on('click',function (e) {
    e.preventDefault();
    done = done - 50;
    nextBatch = nextBatch - 50;
    putDrugs();
    window.scrollTo(0,0);
    if (done <= 0) {
        $('.drugsPrev').addClass('disabled');
    }
    if (nextBatch < obj.length) {
        $('.drugsNext').removeClass('disabled');
    }
});

//============================================ End Mutual Functions ==============================================

//================================================ File Function =================================================

function fail(e) {
    console.log("FileSystem Error");
    console.dir(e);
}

function readFile() {
    logOb.file(function (file) {
        var reader = new FileReader();

        reader.onloadend = function () {
            var string = this.result;
            if (string == "") {
                $('#all-drugs-list').empty();
                $('#all-drugs-list').append('<li>No drugs yet. Please update.</li>');
            } else {
                obj = JSON.parse(string);
                // $('#all-drugs-list').empty();
                // done = 0;
                // nextBatch = 50;
                // putDrugs();
            }
        };
        reader.readAsText(file);
    }, fail);
}

function readUserNotes() {
    userNotes.file(function (file) {
        var reader = new FileReader();

        reader.onloadend = function () {
            var string = this.result;
            userNotesObj = JSON.parse(string);
        };
        reader.readAsText(file);
    }, fail);
}

function checkForUpdate() {
    $.ajax({
        url: "http://rphapps.com/admin/drugs-json.php",
        method: "GET",
        dataType: "json",
    }).done(function (data) {
        newStuff = data;
        oldStuff = obj;
        if (JSON.stringify(newStuff) === JSON.stringify(oldStuff)) {
            Materialize.toast('Local database up to date.', 2000);
        } else {
            Materialize.toast('Update available.', 2000);
        }
    }).fail(function () {
        alert("Failed to connect to server. Please check your connection.");
    });
}

function onDeviceReady() {
    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
        dir.getFile("log.txt", {create: true}, function (file) {
            logOb = file;
            readFile();
        });
        dir.getFile("userNotes.txt", {create: true}, function (file) {
            userNotes = file;
            readUserNotes();
        });
    });
    $('.tooltipped').tooltip({delay: 50});
    $('#all-drugs-list').empty();
}

$(document).ready(function () {
    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        document.addEventListener("deviceready", onDeviceReady, false);
    } else {
        onDeviceReady();
    }
});

function writeStuff(str) {
    if (!logOb) {
        alert("Local file not created");
        return;
    }
    var log = str;
    logOb.createWriter(function (fileWriter) {
        var blob = new Blob([log], {type: 'text/plain'});
        fileWriter.write(blob);
        Materialize.toast('Local database updated.', 2000);
    }, fail);
}

function firstUpdate() {
    $.ajax({
        url: "http://rphapps.com/admin/drugs-json.php",
        method: "GET"
    }).done(function (data) {
        stuff = data;
        writeStuff(stuff);
        $('.loading').css('display', 'none');
    }).fail(function () {
        alert("Failed to connect to server. Please check your connection.");
        $('.loading').css('display', 'none');
    });
}

function update() {
    $.ajax({
        url: "http://rphapps.com/admin/drugs-json.php",
        method: "GET"
    }).done(function (data) {
        stuff = data;
        writeStuff(stuff);
        readFile();
        $('.loading').css('display', 'none');
    }).fail(function () {
        alert("Failed to connect to server. Please check your connection.");
        $('.loading').css('display', 'none');
    });
}

//================================================= End File Function ================================================

//================================================= App functionality ================================================

$('#update-local').on('touchend', function (event) {
    event.preventDefault();
    $('.loading').css('display', 'block');
    update();
});

//resets main search to home page.
$('#main-back').on('click', function () {
    $('#main-back').css('display', 'none');
    $('#main-stuff').css('display', 'block');
    $('#search-nav').addClass('main-search');
    $('#div-search-result').css('display', 'none');
    pSearch.val("");
    pSearch.focus();
});

$('#drug-page-search').on('touchend', function () {
    sSearch.val('');
    $('#search-result').empty();
    sSearch.focus();
});

$('.goto-second-search').on('touchend', function(e) {
    sSearch.focus();
});

$('.back-to-main').on('touchend', function () {
    pSearch.focus();
});

//when open a single drug details page.
function onSingleDrug(id) {
    var jsonStuff = null;
    findByID(id).done(function (object) {
        $.mobile.changePage('#drug-page', {});
        $('#keywords').empty();
        $('#s-drug-brand').text(object.drug_brand);
        $('#s-drug-name').text('(' + object.drug_name + ')');
        $('#s-food').text((object.food !== "") ? object.food : ' - ');
        $('#s-sedation').text((object.sedation !== "") ? object.sedation : ' - ');
        $('#s-preg').text((object.preg_lact !== "") ? object.preg_lact : ' - ');
        $('#s-maj').text((object.maj_se !== "") ? object.maj_se : ' - ');
        $('#s-caution').text((object.caution !== "") ? object.caution : ' - ');
        $('#s-bbw').text((object.bbw !== "") ? object.bbw : ' - ');
        $('#s-key-points').text((object.key_points !== "") ? object.key_points : ' - ');
        $('#s-drug-id').val(object.drug_id);
        var i,
            l;
        for (i = 0; i < object.keywords.length; i = i + 1) {
            jsonStuff = object.keywords[i];
            $('#keywords').append('<li class="popup-trigger"><span class="popup">'
                + jsonStuff.keyword_desc + '</span>' + jsonStuff.keyword_name
                + '<div class="overlay"></div></li>');
        }

        if (userNotesObj.length) {
            l = userNotesObj.length;
            for (i = 0; i < l; i = i + 1) {
                if (userNotesObj[i].id == object.drug_id) {
                    singleUserNote = userNotesObj[i];
                    if (singleUserNote.note !== "") {
                        $('#s-notes').text(singleUserNote.note);
                        $('#notes').val(singleUserNote.note);
                        $('.note-new').css('display', 'none');
                        $('.note-edit').css('display', 'block');
                    } else {
                        $('#s-notes').text("No notes yet.");
                        $('.note-new').css('display', 'block');
                        $('.note-edit').css('display', 'none');
                    }
                    break;
                } else {
                    $('#s-notes').text('No notes yet.');
                    $('.note-new').css('display', 'block');
                    $('.note-edit').css('display', 'none');
                }
            }
        }
    });
}

$(document).on('pagehide', "#result-page", function () {
    $('.back').attr('href', '#result-page');
});

$(document).on('pagebeforeshow', "#all-drugs-page", function () {
    readFile();
});

$(document).on('pageshow', "#all-drugs-page", function () { 
    putDrugs();
});

$(document).on('pagebeforehide', "#all-drugs-page", function () {
    pSearch.val('');
    $('#main-search-result').empty();
    sSearch.val('');
    $('#search-result').empty();
    pageID = false;
    $('.back').attr('href', '#all-drugs-page');
});

$(document).on('pageshow', "#about", function () {
    checkForUpdate();
});

//---- Hard back key pressed function for app exit.
var pageID = false;     //to check if at home page. for app exit function.
var backPressed = 0;    //number of times hard back key pressed.

$(document).on('pageshow', "#home-page", function () {
    pageID = true;
});

$(document).on('pagehide', "#home-page", function () {
    pageID = false;
    $('.back').attr('href', '#home-page');
});

function onBackKey(event) {
    if (pageID === true) {
        event.preventDefault();
        if ($('#search-nav').hasClass('main-search')) {
            backPressed = 1 + backPressed;
            if (backPressed === 2) {
                navigator.app.exitApp();
                backPressed = 0;
            } else {
                Materialize.toast('Press back again to exit.', 2000);
                setTimeout(function () {
                    backPressed = 0;
                }, 2000);
            }
        } else {
            $('#main-stuff').css('display', 'block');
            $('#search-nav').addClass('main-search');
            $('#div-search-result').css('display', 'none');
            pSearch.val("");
        }
    } else if (modalOpened === true) {
        event.preventDefault();
        $('#notes-modal').closeModal();
        modalOpened = false;
    } else {
        history.back();
    }
}

document.addEventListener("backbutton", onBackKey, false);

//=============================================== User Notes ==========================================================

function writeNotes(str) {
    if (!userNotes) {
        alert("User notes file not created.");
        return;
    }
    var log = str;
    userNotes.createWriter(function (fileWriter) {
        var blob = new Blob([log], {type: 'text/plain'});
        fileWriter.write(blob);
        Materialize.toast('User notes saved.', 2000);
    }, fail);
}

$('#notes-save').on('touchend', function () {
    var notes = $('#notes').val(),
        drugID = $('#s-drug-id').val(),
        object = userNotesObj,
        i,
        l,
        foundNote = false;

    if (object.length) {
        l = object.length;
        for (i = 0; i < l; i = i + 1) {
            if (object[i].id == drugID) {
                singleUserNote = object[i];
                if (singleUserNote.note !== notes) {
                    singleUserNote.note = notes;
                    writeNotes(JSON.stringify(object));
                }
                foundNote = true;
                $('#notes-modal').closeModal();
                break;
            }
        }
        if (foundNote === false) {
            if (notes !== "") {
                object.push({"id": drugID, "note": notes});
                writeNotes(JSON.stringify(object));
                $('#notes-modal').closeModal();
            }
        }
    } else {
        object.push({"id": drugID, "note": notes});
        writeNotes(JSON.stringify(object));
        $('#notes-modal').closeModal();
    }
    if (notes !== "") {
        $('#s-notes').text(notes);
        $('.note-new').css('display', 'none');
        $('.note-edit').css('display', 'block');
    } else {
        $('#s-notes').text('No notes yet.');
        $('.note-new').css('display', 'block');
        $('.note-edit').css('display', 'none');
    }
    modalOpened = false;

});

$('#notes-cancel').on('touchend', function () {
    $('#notes').val('');
    modalOpened = false;
});

$(document).on('pagehide', '#drug-page', function () {
    $('#notes').val('');
});

$(document).on('touchstart', '.overlay', function (event) {
    event.preventDefault();
    $(this).siblings('.popup').css('display', 'inline-block');
});

$(document).on('touchend', '.overlay', function (event) {
    event.preventDefault();
    $(this).siblings('.popup').css('display', 'none');
});

$('.add-notes').on('click', function () {
    $('#notes-modal').openModal();
    $('#notes').focus();
    modalOpened = true;
});

// =================================================== Searching =================================================

function doSearch(typed, container) {
    if (typed == "") {
        $('#main-search-result').empty();
        $('search-result').empty();
    } else {
        if (searchByType === 1) {
            var object = obj;
            var results = [];
            if (object.length > 0) {
                $('#main-search-result').empty();
                $('#search-result').empty();
                for (var i = 0; i < object.length; i++) {
                    var drug = object[i];
                    if (drug.drug_name.toLowerCase().indexOf(typed.toLowerCase()) == 0) {
                        results.push(drug);
                    }
                }
            }
            else {
                $('#main-search-result').empty().append('<li style="padding-left: 10px">No results found.</li>');
                $('#search-result').empty().append('<li style="padding-left: 10px">No results found.</li>');
            }
            if(results.length > 0) {
                putValue(container, results);
            }
            else {
                $('#main-search-result').empty();
                $('search-result').empty();
            }
        } 
        else if (searchByType === 2) {
            var object = obj;
            var results = [];
            if (object.length > 0) {
                $('#search-result').empty();
                $('#main-search-result').empty();
                for (var i = 0; i < object.length; i++) {
                    var drug = object[i];
                    if (drug.drug_brand.toLowerCase().indexOf(typed.toLowerCase()) == 0) {
                        results.push(drug);
                    }
                }
            }
            else {
                $('#main-search-result').empty().append('<li style="padding-left: 10px">No results found.</li>');
                $('#search-result').empty().append('<li style="padding-left: 10px">No results found.</li>');
            }
            if(results.length > 0) {
                putValue(container, results);
            }
            else {
                $('#main-search-result').empty();
                $('#search-result').empty();
            }
        }
    }
}

function searchMain() {
    startMainSearch();
}
function searchSecond() {
    startMainSearch();
}

$('#main-search-reset').on('click', function(e) {
    pSearch.val('');
    pSearch.focus();
    $('#main-search-result').empty();
    $('#search-result').empty();
});

$('#second-search-reset').on('click', function(e) {
    sSearch.val('');
    sSearch.focus();
    $('#main-search-result').empty();
    $('#search-result').empty();
});

//====================== Catch enter key event =====================
$(document).on('keypress', function (e) {
    if (e.keyCode == 13) {
        e.preventDefault();
        if (pSearch.is(':focus')) {
            searchMain();
        } else if (sSearch.is(':focus')) {
            searchSecond();
        }
    }
});

pSearch.on('input', function () {
    startMainSearch();
});

sSearch.on('input', function () {
    startSearch();
});

function startMainSearch() {
    var typed = pSearch.val();
    if (typed === "") {
        $('#main-search-result').empty();
    }
    if ($.trim(typed).length > 0) {
        $('#main-stuff').css('display', 'none');
        $('#main-back').css('display', 'inline-block');
        $('#search-nav').removeClass('main-search');
        $('#div-search-result').css('display', 'block');
        window.scrollTo(0,0);
        doSearch(typed, "#main-search-result");
    }
}

function startSearch() {
    var typed = sSearch.val();
    if (typed === "") {
        $('#search-result').empty();
    }
    if ($.trim(typed).length > 0) {
        doSearch(typed, "#search-result");
    }
}

$('#main-type-check').change(function () {
    //By Name/Generic
    if (this.checked) {
        $('.by-name').addClass('chosen');
        $('.by-brand').removeClass('chosen');
        $('.s-by-name').addClass('chosen');
        $('.s-by-brand').removeClass('chosen');
        searchByType = 1;
        pSearch.focus();
        startMainSearch();
        $('#search-type-check').prop('checked', true);
    } else {

    //By Brand
        $('.by-brand').addClass('chosen');
        $('.by-name').removeClass('chosen');
        $('.s-by-brand').addClass('chosen');
        $('.s-by-name').removeClass('chosen');
        searchByType = 2;
        pSearch.focus();
        startMainSearch();
        $('#search-type-check').prop('checked', false);
    }
});

$('#search-type-check').change(function () {
    //By Name/Generic
    if (this.checked) {
        $('.by-name').addClass('chosen');
        $('.by-brand').removeClass('chosen');
        $('.s-by-name').addClass('chosen');
        $('.s-by-brand').removeClass('chosen');
        searchByType = 1;
        sSearch.focus();
        startSearch();
        $('#main-type-check').prop('checked', true);
    } else {

    //By Brand
        $('.by-brand').addClass('chosen');
        $('.by-name').removeClass('chosen');
        $('.s-by-brand').addClass('chosen');
        $('.s-by-name').removeClass('chosen');
        searchByType = 2;
        sSearch.focus();
        startSearch();
        $('#main-type-check').prop('checked', false);
    }
});

//================================================= Show list of keywords ==========================================

var keywordArray = [];
var uniqueKeywords = [];
var uniqueKeyDesc = [];
var table = $('#keywords-table');

function showAllKeywords () {
    for (var i = 0; i < obj.length; i++) {
        var object = obj[i];
        for (var j = 0; j < object.keywords.length; j++) {
            var keyword = object.keywords[j];
            keywordArray.push(keyword);
        }
    }
    $.each(keywordArray, function (index, item) {
        if ($.inArray(item.keyword_name, uniqueKeywords) === -1) {
            uniqueKeywords.push(item.keyword_name);
        }
    });
    $.each(keywordArray, function (index, item) {
        if ($.inArray(item.keyword_desc, uniqueKeyDesc) === -1) {
            uniqueKeyDesc.push(item.keyword_desc);
        }
    });
    
    table.empty();
    table.append('<thead><td>Keywords</td><td>Description</td></thead>');
    
    for (var i = 0; i < uniqueKeywords.length; i++) {
        table.append('<tr>' + '<td>' + uniqueKeywords[i] + '</td>' + '<td>' + uniqueKeyDesc[i] + '</td>' + '</tr>');
    }
}
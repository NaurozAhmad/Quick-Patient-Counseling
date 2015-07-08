/*jslint browser: true*/
/*global $, jQuery, cordova, alert, Blob, FileReader, getPrev, Materialize, update*/

var logOb = null,
    userNotes = null,
    userNotesObj = [],
    stuff = null,
    newStuff = null,
    oldStuff = null,
    obj = null,
    roughObj = null,
    singleObject = null,
    singleUserNote = null,
    searchByType = 2,
    pSearch = $('#main-search'),
    sSearch = $('#search-key'),
    nextBatch = 150,
    done = 0,
    whichSearch = 1,
    notesValue = "";

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

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}


//=============================================== PUT DRUGS IN ALL DRUGS =========================================
function putDrugs() {
    $('#all-drugs-list').empty();

    var object;
    if (obj !== null) {
        if (done >= 0) {
            if (done > 0) {
                $('.drugsPrev').removeClass('disabled');
            }
            else {
                $('.drugsPrev').addClass('disabled');   
            }
            $('.drugsNext').css('display', 'inline-block');
            $('.drugsPrev').css('display', 'inline-block');
            for (var i = done; i < nextBatch; i++) {
                if (i < obj.length) {
                    object = obj[i]; 
                    $('#all-drugs-list').append('<li class="collection-item single-object">' +
                        '<input class="hidden-id" type="hidden" value= "' + object.drug_id + '">' +
                        '<a class="result-link" rel="external">' +
                        '<span style="text-transform: capitalize;">' + object.drug_name +
                        ' <span class="title-name">(' +
                        object.drug_brand + ')</span></span></a></li>');
                }
                else {
                    break;
                }
            }
            $('.current-drugs').text(done + 1 + ' to ' + nextBatch + " out of " + obj.length);
            if (nextBatch > obj.length) {
                $('.current-drugs').text(done + 1 + ' to ' + obj.length + " out of " + obj.length);
            }
        }
    }
    else {
        $('#all-drugs-list').append('<li>No drugs yet. Please update.</li>');
        $('.drugsNext').css('display', 'none');
        $('.drugsPrev').css('display', 'none');
    }
    
    if (nextBatch >= obj.length) {
        $('.drugsNext').addClass('disabled');
    }
    if (nextBatch < obj.length) {
        $('.drugsNext').removeClass('disabled');
    }
}

$('.drugsNext').on('click',function (e) {
    e.preventDefault();
    if(!$('.drugsNext').hasClass('disabled')) {
        done = nextBatch;
        if (done > 0) {
            $('.drugsPrev').removeClass('disabled');
            nextBatch = nextBatch + 150;
            putDrugs();
            window.scrollTo(0,0);
        }
        if (nextBatch >= obj.length) {
            $('.drugsNext').addClass('disabled');
        }
    }
});

$('.drugsPrev').on('click',function (e) {
    e.preventDefault();
    if(!$('.drugsPrev').hasClass('disabled')) {
        done = done - 150;
        nextBatch = nextBatch - 150;
        putDrugs();
        window.scrollTo(0,0);
        if (done <= 0) {
            $('.drugsPrev').addClass('disabled');
        }
        if (nextBatch < obj.length) {
            $('.drugsNext').removeClass('disabled');
        }
    }
});

//Drug list item tap effect.

var scrolling = false;

$(document).on('touchstart', '.single-object', function() {
    scrolling = false;
    $(this).addClass('hovering');
});

$(document).on('touchmove', '.single-object', function() {
    scrolling = true;
    $(this).removeClass('hovering');
});

$(document).on('touchend', '.single-object', function (event) {
    event.preventDefault();
    if (scrolling === false) {
        var id = $(this).children('.hidden-id').val();
        onSingleDrug(id);
        $(this).removeClass('hovering');
    }
});

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
                $('.drugsNext').css('display', 'none');
                $('.drugsPrev').css('display', 'none');

            } else {
                obj = JSON.parse(string);
                roughObj = JSON.parse(string);
                obj = sortByKey(obj, 'drug_name');
                putDrugs();
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

// function checkForUpdate() {
//     $.ajax({
//         url: "http://rphapps.com/admin/drugs-json.php",
//         method: "GET",
//         dataType: "json",
//     }).done(function (data) {
//         newStuff = data;
//         oldStuff = roughObj;
//         if (JSON.stringify(newStuff) === JSON.stringify(oldStuff)) {
//             Materialize.toast('Local database up to date.', 2000);
//         } else {
//             Materialize.toast('Update available.', 2000);
//         }
//     }).fail(function () {
//         alert("Failed to connect to server. Please check your connection.");
//     });
// }


//======================================== DEVICE READY =========================

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
    $('#all-drugs-page').css('display', 'none');
    $('#about-page').css('display', 'none');
    $('#result-page').css('display', 'none');
    $('#drug-page').css('display', 'none');
    setTimeout(function() {
        pSearch.focus();
    }, 100);
    
}

$(document).ready(function () {
    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        document.addEventListener("deviceready", onDeviceReady, false);
    } else {
        onDeviceReady();
    }
});

//==================================== Custom Redirects ========================

$('#info-update').on('click', function(e) {
    $('#home-page').css('display', 'none');
    $('#about-page').css('display', 'block');
    resetPrimarySearch();
    whichSearch = 0;
    window.scrollTo(0,0);
});
$('#browse').on('click', function(e) {
    nextBatch = 150;
    done = 0;
    putDrugs();
    $('body').css('background-color', '#FFF');
    $('#home-page').css('display', 'none');
    $('#all-drugs-page').css('display', 'block');
    resetPrimarySearch();
    whichSearch = 0;
    window.scrollTo(0,0);
});
$('#drugs-to-home').on('click', function(e) {
    $('body').css('background-color', '#e3dedb');
    $('#all-drugs-page').css('display', 'none');
    $('#home-page').css('display', 'block');
    pSearch.focus();
    whichSearch = 1;
    resetPrimarySearch();
    window.scrollTo(0,0);
});
$('#drugs-to-results').on('click', function(e) {
    $('body').css('background-color', '#e3dedb');
    $('#all-drugs-page').css('display', 'none');
    homeSearchView();
    $('#home-page').css('display', 'block');
    pSearch.focus();
    whichSearch = 1;
});
$('#about-to-home').on('click', function(e) {
    $('body').css('background-color', '#e3dedb');
    $('#about-page').css('display', 'none');
    $('#home-page').css('display', 'block');
    pSearch.focus();
    whichSearch = 1;
    window.scrollTo(0,0);
});
$('#single-to-back').on('click', function(e) {
    if (whichSearch === 0) {
        $('#drug-page').css('display', 'none');
        $('#all-drugs-page').css('display', 'block');
        window.scrollTo(0,0);
    }
    if (whichSearch === 1) {
        $('body').css('background-color', '#e3dedb');
        $('#drug-page').css('display', 'none');
        $('#home-page').css('display', 'block');
        pSearch.focus();
        window.scrollTo(0,0);
    }
});
$('#single-to-search').on('click', function(e) {
    sSearch.val('');
    $('#search-result').empty();
    $('body').css('background-color', '#e3dedb');
    $('#drug-page').css('display', 'none');
    $('#home-page').css('display', 'block');
    homeSearchView();
    whichSearch = 1;
    window.scrollTo(0,0);
});

//==================================================== UPDATE LOCAL FILES

function writeStuff(str) {
    if (!logOb) {
        alert("Local file not created");
        return;
    }
    var log = str;
    logOb.createWriter(function (fileWriter) {
        var blob = new Blob([log], {type: 'text/plain'});
        fileWriter.write(blob);
        if(reloaded === 1) {
            Materialize.toast('Local database updated.', 2000);
        }
    }, fail);
}
function update() {
    $.ajax({
        url: "http://rphapps.com/admin/drugs-json.php",
        method: "GET"
    }).done(function (data) {
        stuff = data;
        writeStuff(stuff);
        readFile();
        $('#update-comp-modal').openModal();
        $('#update-message').text('Refresh local files.');
        $('#reload-local').css('display', 'block')
        $('.loading').css('display', 'none');
    }).fail(function () {
        alert("Failed to connect to server. Please check your connection.");
        $('.loading').css('display', 'none');
    });
}

$('#update-local').on('touchend', function (event) {
    event.preventDefault();
    $('.loading').css('display', 'block');
    update();
});

$('#reload-local').on('touchend', function (event) {
    $('#update-message').text('Refresh key idexes.');
    readFile();
    showAllKeywords();
    $('#reload-local').css('display', 'none');
    $('#reload-index').css('display', 'block');
});
$('#reload-index').on('touchend', function (event) {
    $('#update-message').text('');
    readFile();
    showAllKeywords();
    $('#reload-index').css('display', 'none');
    $('#reload-local').css('display', 'none');
    $('#update-comp-modal').closeModal();
});
//==========================================when open a single drug details page.===================================
function onSingleDrug(id) {
    var jsonStuff = null;
    findByID(id).done(function (object) {
        $('body').css('background-color', '#FFF');
        $('#all-drugs-page').css('display', 'none');
        $('#home-page').css('display', 'none');
        $('#result-page').css('display', 'none');
        $('#drug-page').css('display', 'block')
        sSearch.blur();
        pSearch.blur();
        
        $('#keywords').empty();
        $('#s-drug-name').text(object.drug_name);
        $('#s-drug-brand').text('(' + object.drug_brand + ')');
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
                        notesValue = singleUserNote.note;
                        $('.note-new').css('display', 'none');
                        $('.note-edit').css('display', 'inline-block');
                    } else {
                        notesValue = "";
                        $('#s-notes').text("No notes yet.");
                        $('.note-new').css('display', 'inline-block');
                        $('.note-edit').css('display', 'none');
                    }
                    break;
                } else {
                    $('#s-notes').text('No notes yet.');
                    notesValue = "";
                    $('.note-new').css('display', 'inline-block');
                    $('.note-edit').css('display', 'none');
                }
            }
        }
    });
    window.scrollTo(0,0);
}


//----------------------------- Hard back key pressed function for app exit. ---------------------------
var backPressed = 0;    //number of times hard back key pressed.

function onBackKey(event) {
    if (whichSearch === 0) {
        if ($('#all-drugs-page').css('display') == "block") {
            $('body').css('background-color', '#e3dedb');
            $('#all-drugs-page').css('display', 'none');
            $('#home-page').css('display', 'block');
            pSearch.focus();
            whichSearch = 1;
            resetPrimarySearch();
            window.scrollTo(0,0);
        }
        else if ($('#about-page').css('display') == "block") {
            $('body').css('background-color', '#e3dedb');
            $('#about-page').css('display', 'none');
            $('#home-page').css('display', 'block');
            pSearch.focus();
            whichSearch = 1;
            window.scrollTo(0,0);
        }
        else if ($('#drug-page').css('display') == "block") {
            $('#drug-page').css('display', 'none');
            $('#all-drugs-page').css('display', 'block');
            whichSearch = 0;
            window.scrollTo(0,0);
        }
    }
    else if (whichSearch === 1) {
        if ($('#drug-page').css('display') == "block") {
            $('body').css('background-color', '#e3dedb');
            $('#all-drugs-page').css('display', 'none');
            $('#home-page').css('display', 'block');
            pSearch.focus();
            whichSearch = 1;
            window.scrollTo(0,0);
        }
        else if ($('#home-page').css('display') == "block") {
            if(!$('#search-nav').hasClass('main-search')) {
                resetPrimarySearch();
            }
            else {
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
            }
        }
        $('#drug-page').css('display', 'none');
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
        notesValue = notes;
        $('.note-new').css('display', 'none');
        $('.note-edit').css('display', 'inline-block');
    } else {
        $('#s-notes').text('No notes yet.');
        notesValue = "";
        $('.note-new').css('display', 'inline-block');
        $('.note-edit').css('display', 'none');
    }

});

$('#notes-cancel').on('touchend', function () {
    $('#notes').val('');
    $('#notes-modal').closeModal();
});

$(document).on('touchstart', '.overlay', function (event) {
    event.preventDefault();
    var offset = $(this).offset();
    var parentTop = offset.top;
    
    var theText = $(this).siblings('.popup').text();
    $('.keyword-desc-popup').css('display', 'inline-block');
    $('.keyword-desc-popup').text(theText);
    var thisHeight = $('.keyword-desc-popup').css('height');
    thisHeight = thisHeight.replace('px', '');
    
    var offsetTop = parentTop - thisHeight - 30;
    
    $('.keyword-desc-popup').offset({top: offsetTop});
});

$(document).on('touchend', '.overlay', function (event) {
    event.preventDefault();
    $('.keyword-desc-popup').css('display', 'none');
});

$('.add-notes').on('click', function () {
    $('#notes-modal').openModal();
    $('#notes').val(notesValue);
    $('#notes').focus();
});

// =================================================== Searching =================================================

function doUnifiedSearch(typed, container) {
    if (typed == "") {
        $('#main-search-result').empty();
        $('search-result').empty();
    } else {
        var object = obj;
        var results = [];
        var typed = typed.toLowerCase();
        if (object.length > 0) {
            $('#main-search-result').empty();
            $('#search-result').empty();
            for (var i = 0; i < object.length; i++) {
                var drug = object[i];
                if (drug.drug_name.toLowerCase().indexOf(typed) == 0 || drug.drug_brand.toLowerCase().indexOf(typed) == 0) {
                    results.push(drug);
                }
            }
        }
        else {
            $('#main-search-result').empty();
            $('#main-search-result').append('<li style="padding-left: 10px">No results found.</li>');
            $('#search-result').empty();
            $('#search-result').append('<li style="padding-left: 10px">No results found.</li>');
        }
        if (results.length > 0) {
            for (var i = 0; i < 50; i++) {
                var objectBrand = results[i].drug_brand.toLowerCase();
                var objectName = results[i].drug_name.toLowerCase();
                /*if (objectName.indexOf(typed) == 0) {
                    $(container).append('<li class="collection-item single-object">' +
                        '<input class="hidden-id" type="hidden" value= "' + results[i].drug_id + '">' +
                        '<a class="result-link" rel="external">' +
                        '<span>' + '<span style="font-weight: 900">' + typed + '</span>' + objectName.replace(typed, "") +
                        ' <span class="title-name">(' +
                        objectBrand + ')</span></span></a></li>');
                }
                else if (objectBrand.indexOf(typed) == 0) {
                    $(container).append('<li class="collection-item single-object">'  +
                        '<input class="hidden-id" type="hidden" value= "' + results[i].drug_id + '">' +
                        '<a class="result-link" rel="external">' +
                        '<span>' + objectName +
                        ' <span class="title-name">(' + '<span style="font-weight: 900;">' + typed + '</span>' + 
                        objectBrand.replace(typed, "")  + ')</span></span></a></li>');
                }*/
                $(container).append('<li class="collection-item single-object">'  +
                    '<input class="hidden-id" type="hidden" value= "' + results[i].drug_id + '">' +
                    '<a class="result-link" rel="external">' +
                    '<span style="text-transform: capitalize;">' + objectName +
                    ' <span class="title-name">(' + 
                    objectBrand  + ')</span></span></a></li>');
            }
        }
        else {
            $('#main-search-result').empty();
            $('#main-search-result').append('<li style="padding-left: 10px">No results found.</li>');
            $('#search-result').empty();
            $('#search-result').append('<li style="padding-left: 10px">No results found.</li>');
        }
    }
}

function searchMain() {
    startMainSearch();
}
function searchSecond() {
    startMainSearch();
}

pSearch.on('input', function () {
    startMainSearch();
});

sSearch.on('input', function () {
    startSearch();
});

$('#main-search-reset').on('click', function(e) {
    pSearch.val('');
    pSearch.focus();
    $('#main-search-result').empty();
    $('#search-result').empty();
    window.scrollTo(0,0);
});

$('#second-search-reset').on('click', function(e) {
    sSearch.val('');
    sSearch.focus();
    $('#main-search-result').empty();
    $('#search-result').empty();
    window.scrollTo(0,0);
});

function startMainSearch() {
    var typed = pSearch.val();
    if (typed === "") {
        $('#main-search-result').empty();
    }
    if ($.trim(typed).length > 0) {
        $('#main-stuff').css('display', 'none');
        $('#main-search-options').css('display', 'block');
        $('#search-nav').removeClass('main-search');
        $('#div-search-result').css('display', 'block');
        window.scrollTo(0,0);
        doUnifiedSearch(typed, "#main-search-result");
    }
}

function resetPrimarySearch() {
    $('#main-search-options').css('display', 'none');
    $('#main-stuff').css('display', 'block');
    $('#search-nav').addClass('main-search');
    $('#div-search-result').css('display', 'none');
    pSearch.val("");
    pSearch.focus();
    window.scrollTo(0,0);
}

function homeSearchView() {
    $('#main-search-options').css('display', 'block');
    $('#main-stuff').css('display', 'none');
    $('#search-nav').removeClass('main-search');
    $('#div-search-result').css('display', 'block');
    pSearch.val("");
    $('#main-search-result').empty();
    pSearch.focus();
    window.scrollTo(0,0);
}

//resets main search to home page.
$('#main-back').on('click', function () {
    resetPrimarySearch();
});

function startSearch() {
    var typed = sSearch.val();
    if (typed === "") {
        $('#search-result').empty();
    }
    if ($.trim(typed).length > 0) {
        doUnifiedSearch(typed, "#search-result");
    }
}

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
    table.append('<thead style="font-weight: bold"><td>Keywords</td><td>Description</td></thead>');
    
    for (var i = 0; i < uniqueKeywords.length; i++) {
        table.append('<tr>' + '<td>' + uniqueKeywords[i] + '</td>' + '<td>' + uniqueKeyDesc[i] + '</td>' + '</tr>');
    }
}
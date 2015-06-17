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
    searchByType = 1;

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
    for (i = 0; i < jsonObject.length; i = i + 1) {
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
                // $("#update-modal").openModal();
                // firstUpdate();
                $('#all-drugs-list').empty();
                $('#all-drugs-list').append('<li>No drugs yet. Please update.</li>');
            } else {
                obj = JSON.parse(string);
                $('#all-drugs-list').empty();
                putValue('#all-drugs-list', obj);
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
            setTimeout(checkForUpdate(), 5000);
        });
        dir.getFile("userNotes.txt", {create: true}, function (file) {
            userNotes = file;
            readUserNotes();
        });
    });
    $('.tooltipped').tooltip({delay: 50});

}
document.addEventListener('deviceready', onDeviceReady, false);

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

//================================================= End File Function ================================================

//================================================= App functionality ================================================


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

$('#update-local').on('click', function (event) {
    event.preventDefault();
    $('.loading').css('display', 'block');
    update();
});

$('.search-close').on('click', function () {
    $('#main-stuff').css('display', 'block');
    $('#search-nav').addClass('main-search');
    $('#div-search-result').css('display', 'none');
    $('#main-search').val("");
});

$('.search-result-close').on('click', function () {
    history.back();
});

function onSingleDrug(id) {
    var jsonStuff = null;
    findByID(id).done(function (object) {
        $.mobile.changePage('#drug-page', {});
        $('#keywords').empty();
        $('#s-drug-brand').text(object.drug_brand);
        $('#s-drug-name').text('(' + object.drug_name + ')');
        $('#s-food').text(object.food);
        $('#s-sedation').text(object.sedation);
        $('#s-preg').text(object.preg_lact);
        $('#s-maj').text(object.maj_se);
        $('#s-caution').text(object.caution);
        $('#s-bbw').text(object.bbw);
        $('#s-key-points').text(object.key_points);
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

$('.back').on('click', function (event) {
    event.preventDefault();
    history.back();
});

$(document).on("pageshow", "#home-page", function () {
    $('#main-search').focus();
});

var pageID = false;
var backPressed = 0;

$(document).on('pageshow', "#home-page", function () {
    pageID = true;
});

$(document).on('pagehide', "#home-page", function () {
    pageID = false;
});

$(document).on('pageshow', "#all-drugs-page", function () {
    readFile();

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
            $('#main-search').val("");
        }
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

$('#notes-save').on('click', function () {
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
    if(notes !== "") {
        $('#s-notes').text(notes);
        $('.note-new').css('display', 'none');
        $('.note-edit').css('display', 'block');
    } else {
        $('#s-notes').text('No notes yet.');
        $('.note-new').css('display', 'block');
        $('.note-edit').css('display', 'none');
    }

});

$('#notes-cancel').on('click', function () {
    $('#notes').val('');
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
});

// =================================================== Searching =================================================

function findByName(searchKey) {
    var deferred = $.Deferred(),
        object = obj,
        results = object.filter(function (element) {
            var drugName = element.drug_name;
            return drugName.toLowerCase().indexOf(searchKey.toLowerCase()) > -1;
        });
    deferred.resolve(results);
    return deferred.promise();
}

function findByBrand(searchKey) {
    var deferred = $.Deferred(),
        object = obj,
        results = object.filter(function (element) {
            var drugBrand = element.drug_brand;
            return drugBrand.toLowerCase().indexOf(searchKey.toLowerCase()) > -1;
        });
    deferred.resolve(results);
    return deferred.promise();
}

function doSearch(typed, container) {
    if (searchByType === 1) {
        findByName(typed).done(function (object) {
            $(container).empty();
            putValue(container, object);

        });
    } else if (searchByType === 2) {
        findByBrand(typed).done(function (object) {
            $(container).empty();
            putValue(container, object);

        });
    }
}

$('#main-search').on('keyup', function () {
    startMainSearch();
});

$('#search-key').on('keyup', function () {
    startSearch();
});

function startMainSearch() {
    var typed = $('#main-search').val();
    if ($.trim(typed).length > 0) {
        $('#main-stuff').css('display', 'none');
        $('#search-nav').removeClass('main-search');
        $('#div-search-result').css('display', 'block');
        doSearch(typed, "#main-search-result");
    }
}

function startSearch() {
    var typed = $('#search-key').val();
    if ($.trim(typed).length > 0) {
        doSearch(typed, "#search-result");
    }
}

$('#main-type-check').change(function () {
    //By Name/Generic
    if (this.checked) {
        $('.by-name').addClass('chosen');
        $('.by-brand').removeClass('chosen');
        searchByType = 1;
        $('#main-search').focus();
        startMainSearch();
    } else {

    //By Brand
        $('.by-brand').addClass('chosen');
        $('.by-name').removeClass('chosen');
        searchByType = 2;
        $('#main-search').focus();
        startMainSearch();
    }
});

$('#search-type-check').change(function () {
    //By Name/Generic
    if (this.checked) {
        $('.s-by-name').addClass('chosen');
        $('.s-by-brand').removeClass('chosen');
        searchByType = 1;
        $('#search-key').focus();
        startSearch();
    } else {

    //By Brand
        $('.s-by-brand').addClass('chosen');
        $('.s-by-name').removeClass('chosen');
        searchByType = 2;
        $('#search-key').focus();
        startSearch();
    }
});
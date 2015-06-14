/*jslint browser: true*/
/*global $, jQuery, cordova, alert, Blob, FileReader, getPrev, Materialize*/

var logOb = null,
    stuff = null,
    obj = null,
    singleObject = null,
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
            obj = JSON.parse(string);
            $('#all-drugs-list').empty();
            putValue('#all-drugs-list', obj);
        };
        reader.readAsText(file);
    }, fail);
}

function onDeviceReady() {
    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
        alert(cordova.file.dataDirectory);
        dir.getFile("log.txt", {create: true}, function (file) {
            logOb = file;
            readFile();
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

function startMainSearch() {
    var typed = $('#main-search').val();
    if ($.trim(typed).length > 0) {
        $('#main-stuff').css('display', 'none');
        $('#search-nav').removeClass('main-search');
        $('#div-search-result').css('display', 'block');
        doSearch(typed, "#main-search-result");
    }
}

$('#main-search').on('keyup', function () {
    startMainSearch();
});

$('#search-key').on('keyup', function () {
    startSearch();
});

function startSearch() {
    var typed = $('#search-key').val();
    if ($.trim(typed).length > 0) {
        doSearch(typed, "#search-result");
    }
}

$('#update-local').on('click', function (event) {
    event.preventDefault();
    $('#loading').css('display', 'block');

    $.ajax({
        url: "http://rphapps.com/admin/drugs-json.php",
        method: "GET"
    }).done(function (data) {
        stuff = data;
        writeStuff(stuff);
        readFile();
        setTimeout(readFile(), 2000);
        $('#loading').css('display', 'none');
    }).fail(function () {
        alert("Failed to connect to server. Please check your connection.");
        $('#loading').css('display', 'none');
    });
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
        var i;
        for (i = 0; i < object.keywords.length; i = i + 1) {
            jsonStuff = object.keywords[i];
            $('#keywords').append('<li onclick="descModal(\'' + jsonStuff.keyword_name + '\',\'' +
                jsonStuff.keyword_desc + '\')">' + jsonStuff.keyword_name + '</li>');
        }
    });
}

function descModal(name, description) {
    $('#modal-heading').text(name);
    $('#modal-desc').text(description);
    $('#desc-modal').openModal();
}

$('.back').on('click', function (event) {
    event.preventDefault();
    history.back();
});

$(document).on("pagebeforehide", "#drug-page", function () {
    var notes = $('#notes').val();
    if (notes !== "") {
        alert("Saving notes: " + notes + " for drug: " + $("#s-drug-name").text());
    }
});

$('.by-name').on('click', function (event) {
    event.preventDefault();
    $('.by-name').addClass('chosen');
    $('.by-brand').removeClass('chosen');
    searchByType = 1;
    $('#main-search').focus();
    startMainSearch();
});

$('.by-brand').on('click', function (event) {
    event.preventDefault();
    $('.by-brand').addClass('chosen');
    $('.by-name').removeClass('chosen');
    searchByType = 2;
    $('#main-search').focus();
    startMainSearch();
});

$('.s-by-name').on('click', function (event) {
    event.preventDefault();
    $('.s-by-name').addClass('chosen');
    $('.s-by-brand').removeClass('chosen');
    searchByType = 1;
    $('#search-key').focus();
    startSearch();
});

$('.s-by-brand').on('click', function (event) {
    event.preventDefault();
    $('.s-by-brand').addClass('chosen');
    $('.s-by-name').removeClass('chosen');
    searchByType = 2;
    $('#search-key').focus();
    startSearch();
});

var pageID = false;
var backPressed = 0;

$(document).on('pageshow', "#home-page", function () {
    pageID = true;
});

$(document).on('pagehide', "#home-page", function () {
    pageID = false;
});

$(document).on('pageshow', "#all-drugs-list", function () {
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
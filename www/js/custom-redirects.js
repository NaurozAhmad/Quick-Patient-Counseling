$('#info-update').on('touchend', function(e) {
	$('#home-page').css('display', 'none');
	$('#about-page').css('display', 'relative');
});
$('#browse').on('touchend', function(e) {
	$('#home-page').css('display', 'none');
	$('#all-drugs-page').css('display', 'relative');
})
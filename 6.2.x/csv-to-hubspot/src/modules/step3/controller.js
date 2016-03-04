var step3 = (function() {

	var view = '<div class="page" data-step="3">\n	<p>Submitting</p>\n</div>'
	
	// render HTML first
	var init = (function() {
		core.templateRender(core.config.stepsContainerClass, view);
	})();

	var util = (function() {
		var sendToHubspot = function() {
			$.post('http://forms.hubspot.com/uploads/form/v2/' + core.config.hubspotPortal + '/' + core.config.hubspotForm + '?firstname=Phil&lastname=Chan&email=phillipchan1@gmail.com&redirectUrl=www.google.com&pageUrl=liferay.com', function(data) {
				console.log(data);
			});	
		}

		return {
			sendToHubspot: sendToHubspot
		}
	})();

})(core);
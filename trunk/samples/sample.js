Ext.onReady(function(){
	
	if (!window.google || !google.gears) {
		
		Ext.MessageBox.confirm(
			"Gears Dialog",
			"This website has additional upload functionality "+
			"that requires the Google Gears plugin. "+
			"Would you like to take a minute to install Google Gears and "+
			"experience enhanced uploads?",
			function(btn){
				if(btn=='ok'||btn=='yes'){
					var message = "Gears will allow you upload multiple images with ease!";
					location.href = [
						"http://gears.google.com/?action=install",
						"&message="+encodeURIComponent(message),
						"&return="+location.href
					].join('');
				}
			}
		);
		
	}
	
	else{
		
		var panel = new Ext.ux.uploader.Panel({
			adapter 		:'gears',
			extraParams		:{adapter:'gears'},
			width			:300,
			height			:250,
			maxRequests		:2,
			title			:'Gears Panel',
			renderTo		:"gears-panel",
			autoScroll		:true,
			fullUpload		:true,
			filters			:['.jpg','.png','.gif']
		});
		
	}
	
	var panel2 = new Ext.ux.uploader.Panel({
		adapter 		:'html',
		extraParams		:{adapter:'html'},
		width			:300,
		height			:250,
		maxRequests		:1,
		title			:'Html Panel',
		renderTo		:"html-panel",
		autoScroll		:true,
		filters			:['.jpg','.gif','.png']
	});
	
	
});
Ext.ux.uploader.Util = {
	getSize : function(bytes){
		var sizes = ['KB','MB','GB'];
		for(var i=sizes.length-1; i>=0; i--){
			var s= 1024;
			for(var x=0;x<i;x++){
				s*=1000;
			}
			if( bytes > s ){
				var s = bytes / s;
				s = parseInt(s*100)/100;
				return s+' '+sizes[i];
			}
		}
		return bytes+' bytes';
	}
};
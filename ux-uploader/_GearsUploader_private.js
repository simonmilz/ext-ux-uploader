
Ext.namespace('Ext.ux');

Ext.ux.GearsUploader = function(config){
	
	var console = window.console || {
		log : Ext.emptyFn
	};
	
	var paramKeys = {
		'filename'		:'filename',
		'start'			:'start',
		'end'			:'end',
		'total'			:'total',
		'length'		:'length'
	};
	
	Ext.ux.GearsUploader.superclass.constructor.call(this,config);
	
	Ext.apply(paramKeys,this.paramKeys||{});
	
	var index = 0;
	var uploading = false;
	
	var maxRequests = this.maxRequests || false;
	if( maxRequests===true){
		maxRequests = 2;
	}
	
	var gearsRequestsIndex=0;
	var gearsRequests = new Ext.util.MixedCollection();
	
	gearsRequests.on('remove', function(obj){
		delete obj;
	});
	
	var queue = new Ext.util.MixedCollection();
	var complete = new Ext.util.MixedCollection();
	
	var gearsDesktop = google.gears.factory.create('beta.desktop');
	
	var gearsOpenFilesOptions = this.gearsOpenFilesOptions || {};
	var chunkLength = this.chunkLength || 20480;
	var fullUpload = this.fullUpload || false;
	var maxSize = false;
	
	if( this.filters ){
		gearsOpenFilesOptions.filters = this.filters;
	}
	if( this.singleFile ){
		gearsOpenFilesOptions.singleFile = this.singleFile;
	}
	if( this.maxSize ){
		maxSize = this.maxSize;
	}
	
	var maxRetries = this.maxRetries || 3;
	var retries = 0;
	
	var self = this;
	
	function getFileSignature( file ){
		return [file.name,file.blob.length].join('-');
	}
	
	function upload( options ){
		// forget the options for now...
		uploading = false;
		var uploadingFiles = 0;
		queue.each(function(file){
			if( !file.uploadComplete && !file.uploading ){
				// ok lets start with this..
				uploading = true;
				self.fireEvent('uploadstart',file,getFileUploadInfo(file));
				uploadingFiles++;
				send(file);
				return maxRequests && uploadingFiles < maxRequests;
			}
			else{
				if( file.uploading ){
					uploadingFiles++;
					uploading = true;
				}
			}
			return true;
		});
		if( !uploading ){
			self.fireEvent('queuecomplete');
		}
	}
	
	function onFilesQueued( files ){
		for(var i = 0; i < files.length; i++){
			var file = files[i];
			var sig = getFileSignature(file);
			if( maxSize && file.blob.length > maxSize ){
				self.fireEvent('queueerror', file);
				continue;
			}
			if(!queue.containsKey(sig)){
				queue.add(sig,{
					id			:sig,
					data		:file,
					uploaded	:0
				});
				self.fireEvent('filequeued', queue.get(sig));
			}
		}
	}
	
	function getFileUploadInfo( file, loaded ){
		if( !file.uploaded ){
			file.uploaded = 0;
		}
		var info={};
		info.start 		= file.uploaded+(loaded||0);
		info.total 		= file.data.blob.length;
		info.end 		= Math.min(info.start + ( fullUpload ? info.total : chunkLength), info.total );
		info.length 	= info.end-info.start;
		info.percent 	= info.start / info.total;
		return info;
	}
	
	function getChunk( file ){
		var info = getFileUploadInfo( file );
		if( info.start==0 && info.end == info.total ){
			return file.data.blob;
		}
		else{
			return file.data.blob.slice( info.start,info.length );
		}
	}
	
	function sendChunk( file ){
		gearsRequest = google.gears.factory.create('beta.httprequest');
		var info= getFileUploadInfo(file);
		var h = {
			'Content-Disposition' 	: "attachment; filename='"+file.data.name+"'",
			'Content-Type'			: "application/octet-stream",
			'Content-Range'			: "bytes "+info.start+"-"+info.end+"/"+info.total
		};
		
		var params = {};
		for(var key in paramKeys){
			val = (key == 'filename') ? file.data.name : info[key] || '';
			params[paramKeys[key]] = val;
		}
		var url = this.url || '?';
		params = Ext.urlEncode(Ext.apply(params,self.extraParams||{}));
		url += (url.indexOf('?') != -1 ? '&' : '?') + params;
		gearsRequest.open('POST', url);
		
		for( var x in h ){
			if (h.hasOwnProperty(x)) {
				try{
					gearsRequest.setRequestHeader( x, h[x] );
				}catch(e){
					console.log(e.message, x, h[x]);
				}
			}
		}
		var index = gearsRequestsIndex++;
		gearsRequests.add(index,{req:gearsRequest,file:file});
		gearsRequest.onreadystatechange = onReadyStateChange.createDelegate(self,[gearsRequest,index,file]);
		gearsRequest.upload.onprogress = function(progress){
			try{
				var loaded = progress.loaded;
				var info = getFileUploadInfo(file,loaded);
				self.fireEvent('uploadprogress', file, info );
			}
			catch(e){
				console.log(e);
			}
		};
		var info = getFileUploadInfo(file);
		file.requestStartByte = info.start;
		try{
			gearsRequest.send( getChunk( file ) );
			file.uploading=true;
		}
		catch(e){
			console.log(e);
		}
		return gearsRequest;
	}
	
	function onReadyStateChange( req, index, file ){
		gearsRequests.removeKey(index);
		file.uploading=false;
		if( req.readyState == 4 ){
			switch( req.status ){
				case 200:
					// fire progress event...
					// also, check for finished state.
					
					try{
						retries = 0;
						var response = Ext.decode( req.responseText );
						var info = getFileUploadInfo(file);
						file.uploaded = info.end;
						self.fireEvent('uploadprogress', file, getFileUploadInfo(file) );
						if(info.end == info.total){
							// fire finished event
							file.uploadComplete=true;
							self.fireEvent('uploadcomplete', file);
							if( uploading ){
								upload();
							}
						}
						else{
							if( uploading ){
								send(file);
							}
						}
					}
					catch(e){
						// umm... the response was not in json format.
						// thats not supposed to happen...
						console.log(e);
					}
					break;
				default:
					// shit. i guess we could try again...
					if( retries < maxRetries ){
						send(file);
						retries++;
					}
					
			}
		}
	}
	
	function send(file){
		return sendChunk(file);
	}
	
	this.on('uploadcomplete', function(file){
		complete.add(file.id, file);
		queue.removeKey(file.id);
	});
	
	/**
	 * Implement the interface methods
	 */
	this.browse = function(){
		gearsDesktop.openFiles(onFilesQueued.createDelegate(this),gearsOpenFilesOptions);
	};
	this.removeAt = function(index){
		queue.removeAt(index);
	};
	this.upload = this.resume = function(options){
		// start the upload
		upload(options);
	};
	this.pause = function(){
		// pause all upload activity
		gearsRequests.each(function(obj,key){
			var req = obj.req;
			try{
				obj.file.uploading = false;
				req.abort();
				gearsRequests.removeKey(key)
			}
			catch(e){
				// no biggy.
				console.log(e);
			}
		});
		uploading = false;
	};
	this.togglePause = function(){
		if( uploading ){
			this.pause();
		}else{
			this.upload();
		}
	};
	this.getComplete = function(){
		return complete;
	};
	this.getRequestsCount = function(){
		return gearsRequests.getCount();
	};
};
Ext.extend( Ext.ux.GearsUploader, Ext.ux.UploaderInterface);
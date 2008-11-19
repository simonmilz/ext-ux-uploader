Ext.namespace('Ext.ux.uploader');
Ext.ux.uploader.GearsAdapter = Ext.extend( Ext.ux.uploader.AbstractAdapter, {
	console : window.console || {log:Ext.emptyFn},
	_init : function(){
		this._paramKeys = Ext.apply({
			'filename'		:'filename',
			'start'			:'start',
			'end'			:'end',
			'total'			:'total',
			'length'		:'length'
		}, this.paramKeys || {} );
		
		if( this.button ){
			this.button.setHandler(this.browse, this);
		}
		
		this._isUploading = false;
		this._maxRequests = this.maxRequests || false;
		if( this._maxRequests===true){
			maxRequests = 2;
		}
		
		this._gearsRequests = new Ext.util.MixedCollection();
		this._gearsRequests.on('remove', function(obj){
			delete obj;
		});
		
		this._queue = new Ext.util.MixedCollection();
		this._complete = new Ext.util.MixedCollection();
		
		this._gearsDesktop = google.gears.factory.create('beta.desktop');
		this._gearsOpenFilesOptions = this.gearsOpenFilesOptions || {};
		
		this._chunkLength = this.chunkLength || 20480;
		this._fullUpload = this.fullUpload || false;
		this._maxSize = false;
		
		if( this.filters ){
			this._gearsOpenFilesOptions.filter = this.filters;
		}
		if( this.singleFile ){
			this._gearsOpenFilesOptions.singleFile = this.singleFile;
		}
		if( this.maxSize ){
			this._maxSize = this.maxSize;
		}
		
		this._maxRetries = this.maxRetries || 3;
		this._retries = 0;
		
		this.on('uploadcomplete', function(file){
			try{
				this._gearsRequests.removeKey(file.id);
				//this._complete.add(file.id, file);
				var r = this._queue.removeKey(file.id);
				delete r;
			}
			catch(e){
				this.console.log(e);
			}
		}, this);
	},
	
	_getFileSignature : function( file ){
		return [file.name,file.blob.length].join('-');
	},
	
	_onFilesQueued : function( files ){
		for(var i = 0; i < files.length; i++){
			var sig = this._getFileSignature(files[i]);
			if( this._maxSize && files[i].blob.length > this._maxSize ){
				this.fireEvent('queueerror', files[i]);
				continue;
			}
			if( !this._validFileName( files[i].name) ){
				this.fireEvent('queueerror', files[i]);
				continue;
			}
			if(!this._queue.containsKey(sig)){
				this._queue.add(sig,{
					id			:sig,
					data		:files[i],
					uploaded	:0
				});
				this.fireEvent('filequeued', this._queue.get(sig));
			}
		}
	},
	
	_getFileUploadInfo : function( file, loaded ){
		if( !file.uploaded ){
			file.uploaded = 0;
		}
		var info={};
		info.start 		= file.uploaded+(loaded||0);
		info.total 		= file.data.blob.length;
		info.end 		= Math.min(info.start + ( this._fullUpload ? info.total : this._chunkLength), info.total );
		info.length 	= info.end-info.start;
		info.percent 	= info.start / info.total;
		return info;
	},
	
	_upload : function( options ){
		// forget the options for now...
		this._isUploading = false;
		var uploadingFiles = 0;
		this._queue.each(function(file){
			if( !file.uploadComplete && !file.uploading ){
				// ok lets start with this..
				this._isUploading = true;
				this.fireEvent('uploadstart',file,this._getFileUploadInfo(file));
				uploadingFiles++;
				this._send(file);
				return this._maxRequests && uploadingFiles < this._maxRequests;
			}
			else{
				if( file.uploading ){
					uploadingFiles++;
					this._isUploading = true;
				}
			}
			return true;
		}, this);
		if( !this._isUploading ){
			this.fireEvent('queuecomplete');
		}
	},
	
	_sendChunk : function( file ){
		
		try{
			//this._gearsRequests.removeKey(file.id);
		}catch(e){
			
		}
		
		var req = google.gears.factory.create('beta.httprequest');
		req.onreadystatechange = this._onReadyStateChange.createDelegate(this,[file.id]);
		req.upload.onprogress = this._onFileProgress.createDelegate(this,[file.id],0);
		this._gearsRequests.add(file.id,req);

		var info = this._getFileUploadInfo(file);
		var h = {
			'Content-Disposition' 	: "attachment; filename='"+file.data.name+"'",
			'Content-Type'			: "application/octet-stream",
			'Content-Range'			: "bytes "+info.start+"-"+info.end+"/"+info.total
		};
		
		var params = {};
		for(var key in this._paramKeys){
			val = (key == 'filename') ? file.data.name : info[key] || '';
			params[this._paramKeys[key]] = val;
		}
		var url = this.url || '?';
		params = Ext.urlEncode(Ext.apply(params,this.extraParams||{}));
		url += (url.indexOf('?') != -1 ? '&' : '?') + params;
		req.open('POST', url);
		
		for( var x in h ){
			if (h.hasOwnProperty(x)) {
				try{
					req.setRequestHeader( x, h[x] );
				}catch(e){
					this.console.log(e.message, x, h[x]);
				}
			}
		}
		
		var info = this._getFileUploadInfo(file);
		file.requestStartByte = info.start;
		try{
			req.send(
				(info.start==0 && info.end == info.total) ?
				file.data.blob :
				file.data.blob.slice(info.start,info.length)
			);
			file.uploading=true;
		}
		catch(e){
			this.console.log(e);
		}
		return req;
	},
	
	_onReadyStateChange : function( key ){
		var file = this._queue.get(key);
		var req = this._gearsRequests.get(key);
		try{
			if( req.readyState == 4 ){
				file.uploading=false;
				switch( req.status ){
					case 200:
						
						try{
							this._retries = 0;
							var response = Ext.decode( req.responseText );
							var info = this._getFileUploadInfo(file);
							file.uploaded = info.end;
							this.fireEvent('uploadprogress', file, this._getFileUploadInfo(file) );
							
							if(info.end == info.total){
								// fire finished event
								file.uploadComplete=true;
								this.fireEvent('uploadcomplete', file);
								if( this._isUploading ){
									this._upload();
								}
							}
							else{
								if( this._isUploading ){
									this._send(file);
								}
							}
						}
						catch(e){
							// umm... the response was not in json format.
							// thats not supposed to happen...
							this.console.log(e);
						}
						break;
					
					default:
						// shit. i guess we could try again...
						if( this._retries < this._maxRetries ){
							this._send(file);
							retries++;
						}
				}
			}
		}
		catch(e){
			this.console.log(e);
		}
	},
	
	_onFileProgress : function(fileId,progress){
		try{
			var file = this._queue.get(fileId);
			var loaded = progress.loaded;
			var info = this._getFileUploadInfo(file,loaded);
			this.fireEvent('uploadprogress', file, info );
		}
		catch(e){
			this.console.log(e);
		}
	},
	
	_send : function(file){
		return this._sendChunk(file);
	},
	
	/**
	 * Implement the interface methods
	 */
	reset : function(){
		this._queue.each(function(obj){
			delete obj;
		});
		delete this._queue;
		this._queue = new Ext.util.MixedCollection();
		this._complete.each(function(obj){
			delete obj;
		});
		delete this._complete;
		this._complete = new Ext.util.MixedCollection();
	},
	
	browse : function(){
		this._gearsDesktop.openFiles(this._onFilesQueued.createDelegate(this),this._gearsOpenFilesOptions);
	},
	
	removeAt : function(index){
		this._queue.removeAt(index);
	},
	
	upload : function(options){
		// start the upload
		this._upload(options);
	},
	
	pause : function(){
		// pause all upload activity
		this._gearsRequests.each(function(req,key){
			var file = this._queue.get(key);
			try{
				file.uploading = false;
				req.abort();
				this._gearsRequests.removeKey(key)
			}
			catch(e){
				// no biggy.
				this.console.log(e);
			}
		}, this);
		this._isUploading = false;
	},
	
	togglePause : function(){
		if( this._isUploading ){
			this.pause();
		}else{
			this.upload();
		}
	},
	
	getComplete : function(){
		return this._complete;
	},
	
	getRequestsCount : function(){
		return this._gearsRequests.getCount();
	}
});
Ext.ux.uploader.AdapterFactory.reg('gears', Ext.ux.uploader.GearsAdapter);
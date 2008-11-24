Ext.namespace('Ext.ux.uploader');
Ext.ux.uploader.GearsAdapter = Ext.extend( Ext.ux.uploader.AbstractAdapter, {
	console : window.console || {log:Ext.emptyFn},
	_init : function(){
		
		this._uploading = false;
		
		Ext.apply(this._features, {
			'pauseupload'	:true,
			'filesize'		:true,
			'progress'		:true
		});
		
		this._paramKeys = Ext.apply({
			'filename'		:'filename',
			'start'			:'start',
			'end'			:'end',
			'total'			:'total',
			'length'		:'length'
		}, this.paramKeys || {} );
		delete this.paramKeys;
		
		if( this.button ){
			this.button.setHandler(this.browse, this);
		}
		this._maxRequests = this.maxRequests || false;
		
		this._queue = new Ext.util.MixedCollection();
		this._queue.on('remove', this._onFileUploadRemoved, this);
		
		this._complete = new Ext.util.MixedCollection();
		
		this._gearsDesktop = google.gears.factory.create('beta.desktop');
		this._gearsOpenFilesOptions = this.gearsOpenFilesOptions || {};
		
		this._chunkLength = this.chunkLength || 20480;
		this._fullUpload = this.fullUpload || false;
		this._maxSize = false;
		
		if( this.imagesOnly ){
			this.filters = ['.jpg','.gif','.png','.bmp'];
		}
		
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
	},
	
	_onFileUploadRemoved : function(fileUpload){
		this.fireEvent('fileremoved', fileUpload );
		fileUpload.destroy();
		if( this._queue.getCount() == 0 ){
			this.fireEvent('queueempty', this);
		}
	},
	
	_getFileSignature : function( file ){
		return [file.name,file.blob.length].join('-');
	},
	
	_onFilesQueued : function( files ){
		var errors = [];
		for(var i = 0; i < files.length; i++){
			var sig = this._getFileSignature(files[i]);
			if( this._queue.containsKey(sig) ){
				continue;
			}
			if( this._maxSize && files[i].blob.length > this._maxSize ){
				var size = Ext.ux.uploader.Util.getSize(this._maxSize);
				errors[errors.length] = {
					message :String.format(this.lang.EXCEEDS_MAXSIZE, size),
					name	:files[i].name
				};
				continue;
			}
			if( !this._validFileName( files[i].name) ){
				errors[errors.length] = {
					message	:this.lang.INVALID_FILETYPE,
					name	:files[i].name
				};
				continue;
			}
			
			var fileUpload = new Ext.ux.uploader.GearsFileUpload({
				id			:sig,
				uploader	:this,
				file		:files[i],
				filename	:this._basename(files[i].name)
			});
			
			fileUpload.on('uploadsuccess', this._onUploadSuccess, this);
			fileUpload.on('uploadfailure', this._onUploadFailure, this);
			
			this._queue.add(sig, fileUpload);
			this.fireEvent('filequeued', fileUpload);
		}
		if( errors.length > 0 ){
			this.fireEvent('queueerror', errors);
		}
	},
	
	_upload : function( options ){
		var finished = true;
		var requests = 0;
		this._queue.each( function(fileUpload,index,key){
			if( fileUpload.isUploading() ){
				finished = false;
				requests++;
				return true;
			}
			if( fileUpload.isComplete() ){
				return true;
			}
			fileUpload.start();
			if( !this._uploading ){
				this._uploading = true;
				this.fireEvent('uploadstart', this);
			}
			finished = false;
			requests++;
			return this.maxRequests && requests < this.maxRequests;
		}, this );
		if( finished !== false ){
			if( this._uploading ){
				this._uploading = false;
				this.fireEvent('uploadstop',this);
			}
			this.fireEvent('queuecomplete');
		}
	},
	
	_onUploadSuccess : function(fileUpload){
		this._queue.remove(fileUpload);
		fileUpload.destroy();
		this._upload();
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
		this._gearsDesktop.openFiles(
			this._onFilesQueued.createDelegate(this),
			this._gearsOpenFilesOptions
		);
	},
	
	remove : function(fileUpload){
		this._queue.remove(fileUpload);
	},
	
	removeAt : function(index){
		this._queue.removeAt(index);
	},
	
	clearQueue : function(){
		this._queue.each( function(o){
			this._queue.remove(o);
			o.destroy();
		},this);
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
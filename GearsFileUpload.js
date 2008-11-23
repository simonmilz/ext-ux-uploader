Ext.namespace('Ext.ux.uploader');

Ext.ux.uploader.GearsFileUpload = Ext.extend( Ext.ux.uploader.AbstractFileUpload, {
	
	_init : function(){
		this._request = null;
		this._uploading = false;
		this._uploaded = 0;
		this._requestProgress = 0;
		this._requestLength = 0;
		this._complete = false;
		this._chunkLength = this.uploader.get('chunkLength');
		this._fullUpload = this.uploader.get('fullUpload');
		this._maxRetries = this.uploader.get('maxRetries');
		this._retries = 0;
	},
	
	start : function(){
		if( !this.isUploading() && !this.isComplete() ){
			this._uploading=true;
			this.fireEvent('uploadstart', this);
			this._sendChunk();
		}
	},
	
	_getUploadInfo : function(){
		var info={};
		info.start 		= this._uploaded+(this._requestProgress);
		info.total 		= this.file.blob.length;
		info.end 		= Math.min(info.start + ( this._fullUpload ? info.total : this._chunkLength), info.total );
		info.percent	= info.start/info.total;
		return info;
	},
	
	_sendChunk : function(){
		
		var info=this._getUploadInfo();
		if( this._request ) delete this._request;
		this._request = google.gears.factory.create('beta.httprequest');
		this._request.onreadystatechange = this._onReadyStateChange.createDelegate(this);
		this._request.upload.onprogress = this._onUploadProgress.createDelegate(this);

		var h = {
			'Content-Disposition' 	: "attachment; filename='"+this.getFilename()+"'",
			'Content-Type'			: "application/octet-stream",
			'Content-Range'			: "bytes "+info.start+"-"+info.end+"/"+info.total
		};
		
		var params = {};
		for(var key in this._paramKeys){
			val = (key == 'filename') ? this.getFilename() : info[key] || '';
			params[this._paramKeys[key]] = val;
		}
		var url = this.uploader.get('url') || '?';
		params = Ext.urlEncode(Ext.apply(params,this.uploader.extraParams||{}));
		url += (url.indexOf('?') != -1 ? '&' : '?') + params;
		this._request.open('POST', url);
		
		for( var x in h ){
			if (h.hasOwnProperty(x)) {
				this._request.setRequestHeader( x, h[x] );
			}
		}
		this._requestProgress=0;
		this._requestLength = info.end - info.start;
		this._request.send(
			(info.start==0 && info.end == info.total) ?
			this.file.blob :
			this.file.blob.slice(info.start,this._requestLength)
		);
		return this._request;
	},
	
	_onReadyStateChange : function( key ){
		try{
			if( this._request.readyState == 4 ){
				this._uploading=false;
				switch( this._request.status ){
					case 200:
						
						try{
							this._retries = 0;
							var response = Ext.decode( this._request.responseText );
							this._uploaded += this._requestLength;
							this.fireEvent('uploadprogress', this, this._getUploadInfo() );
							if(this._uploaded == this.file.blob.length ){
								// fire finished event
								this._complete = true;
								this.fireEvent('uploadsuccess', this);
							}
							else{
								this._sendChunk();
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
						if( this._retries < this._maxRetries ){
							this._sendChunk();
							retries++;
						}else{
							this.fireEvent('uploaderror', this);
						}
				}
			}
		}
		catch(e){
			console.log(e);
		}
	},
	
	_onUploadProgress : function(progress){
		try{
			this._requestProgress = progress.loaded;
			this.fireEvent('uploadprogress', this, this._getUploadInfo() );
		}
		catch(e){
			console.log(e);
		}
	},
	
	getFilename : function(){
		return this.filename;
	},
	
	destroy : function(){
		
	},
	
	isUploading : function(){
		return this._uploading;
	},
	
	isComplete : function(){
		return this._complete;
	},
	
	getId : function(){
		return this.id;
	}
	
});
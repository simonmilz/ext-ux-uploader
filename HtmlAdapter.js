Ext.namespace('Ext.ux.uploader');
Ext.ux.uploader.HtmlAdapter = Ext.extend( Ext.ux.uploader.AbstractAdapter, {
	_init : function(){
		this._uploading = false;
		this._errorReader = this.decodeHtmlInResponse !== false ? false : this._ErrorReader();
		
		this._queue = new Ext.util.MixedCollection();
		this._queue.on('remove', this._onFileUploadRemoved, this);
		this._completed = new Ext.util.MixedCollection();
		
		this._btn = this.button || new Ext.Button({buttonOnly:true});
		if( !this._btn.rendered ){
			this._btn.on('render',this._onButtonRender, this);
		}else{
			this._onButtonRender();
		}
		
		this._paramKeys = Ext.apply({
			'filename'	:'filename',
			'file'		:'file'
		}, this.paramKeys || {} );
		
		delete this.paramKeys;
		
		this._queueEl = Ext.fly(document.body).createChild({
			tag:'div',
			style:'display:none'
		});
	},
	
	_onFileUploadRemoved : function(fileUpload){
		this.fireEvent('fileremoved', fileUpload );
		if( this._queue.getCount() == 0 ){
			this.fireEvent('queueempty', this);
		}
	},
	
	_ErrorReader : function(options){
		options = options || {};
		return {
			read: function(r){
				r.responseText = r.responseText.replace(/\&lt\;/g, '<');
				r.responseText = r.responseText.replace(/\&gt\;/g, '>');
				if( options.beforeDecode ){
					options.beforeDecode.apply(options.scope || window, [r] );
				}
				try{
					var rs = Ext.decode(r.responseText);
				}
				catch(e){
					return {
						"success"	:false,
						"message"	:"Invalid response. Expected JSON string.",
						"response"	:r.responseText
					};
				}
				var t = Ext.type(rs);
				if( t == 'string' || t == 'element' ){
					return {success: false};
				}
				rs.records = [];
				for( var i in rs.errors ){
					rs.records[rs.records.length]={data:{id:i, msg:rs.errors[i]}};
				}
				return rs;
			}
		};
	},
	
	_onButtonRender : function(){
		
		this._btn.getEl().addClass('x-form-file-btn');
		this._wrap = this._btn.getEl().wrap({
			cls:'x-form-file-wrap'
		});
		(function(){
			var w = this._btn.getEl().getWidth();
			this._wrap.setWidth(w);
		}).defer(20,this); /* IE is so weird... */
		this._createActiveFileInput();
	},
	
	_createActiveFileInput : function(){
		this._activeInput = this._wrap.createChild({
			tag			:'input',
			type		:'file',
			cls			:'x-form-file',
			size		:1
		});
		this._activeInput.hover(
			function(){
				this._btn.getEl().addClass('x-btn-over');
			}.createDelegate(this),
			function(){
				this._btn.getEl().removeClass('x-btn-over');
			}.createDelegate(this)
		);
		this._activeInput.on('mousedown', this._onMouseDown, this);
        this._activeInput.on('mouseup', this._onMouseUp, this);
		this._activeInput.on('change', this._onFileSelected, this);
		return this._activeInput;
	},
	
    // private
    _onMouseDown : function(e){
        if(!this.disabled && e.button == 0){
            this._btn.getEl().addClass("x-btn-click");
            Ext.getDoc().on('mouseup', this._onMouseUp, this);
        }
    },
    // private
    _onMouseUp : function(e){
        if(e.button == 0){
			this._btn.getEl().removeClass('x-btn-over');
            this._btn.getEl().removeClass("x-btn-click");
            Ext.getDoc().un('mouseup', this._onMouseUp, this);
        }
    },
	
	_onFileSelected : function(){
		// check to see if it was already added...
		var value = this._basename(this._activeInput.dom.value);
		
		if( this._queue.containsKey(value) ){
			return;
		}
		if( !this._validFileName(value) ){
			
			// reset this so the change event will
			// definitely fire again.
			this._activeInput.dom.value='';
			
			// let everyone know that the chosen file
			// was no good.
			this.fireEvent('queueerror',[{
				name	:value,
				message	:this.lang.INVALID_FILETYPE
			}]);
			return;
		}
		
		this._activeInput.un('mousedown', this._onMouseDown, this);
        this._activeInput.un('mouseup', this._onMouseUp, this);
		this._activeInput.un('change', this._onFileSelected, this);
		
		var fileUpload = new Ext.ux.uploader.HtmlFileUpload({
			id			:value,
			filename	:value,
			uploader 	:this,
			input		:this._activeInput
		});
		
		fileUpload.on('uploadsuccess', this._onUploadSuccess, this);
		fileUpload.on('uploadfailure', this._onUploadFailure, this);
		
		this._queue.add(value, fileUpload );
		this.fireEvent('filequeued', fileUpload );
		this._createActiveFileInput();
		
	},
	
	_upload : function(){
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
	
	_onUploadFailure : function(file,form,action){
		file.uploading=false;
		//this._upload();
	},
	
	upload : function(){
		this._upload();
	},
	
	removeAt : function(index){
		this._queue.removeAt(index);
	},
	
	remove : function(fileUpload){
		this._queue.remove(fileUpload);
	}
	
});

Ext.ux.uploader.AdapterFactory.reg('html', Ext.ux.uploader.HtmlAdapter);
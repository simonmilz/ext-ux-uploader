Ext.namespace('Ext.ux.uploader');
Ext.ux.uploader.HtmlAdapter = Ext.extend( Ext.ux.uploader.AbstractAdapter, {
	_init : function(){
		
		this._errorReader = this.decodeHtmlInResponse !== false ? false : this._ErrorReader();
		
		this._queue = new Ext.util.MixedCollection();
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
		
		this._queueEl = Ext.fly(document.body).createChild({
			tag:'div',
			style:'display:none'
		});
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
		this._wrap = this._btn.getEl().wrap({
			cls:'x-form-field-wrap x-form-file-wrap'
		});
		this._wrap.setWidth(this._btn.getEl().getWidth());
		this._createActiveFileInput();
	},
	
	_createActiveFileInput : function(){
		this._activeInput = this._wrap.createChild({
			tag			:'input',
			type		:'file',
			cls			:'x-form-file',
			style		:{
				top			:0
			},
			
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
	
	_onFileSelected : function( field, input ){
		// check to see if it was already added...
		var value = this._basename(this._activeInput.dom.value);
		
		if( this._queue.containsKey(value) ){
			return;
		}
		if( !this._validFileName(value) ){
			this._activeInput.dom.value='';
			this.fireEvent('queueerror',[{
				name	:value,
				message	:this.lang.INVALID_FILETYPE
			}]);
			return;
		}
		// create a form for this bad boy...
		var formEl = this._queueEl.createChild({
			'tag' : 'form'
		});
		var form = new Ext.form.BasicForm( formEl,{
			fileUpload			:true,
			errorReader			:this._errorReader
		});
		
		// move the input out of button and create a new one...		
		var file = {
			id : value,
			form : form,
			el : this._activeInput.appendTo( formEl ),
			data : {name : value},
			uploaded : 0
		};
		
		this._activeInput.un('mousedown', this._onMouseDown, this);
        this._activeInput.un('mouseup', this._onMouseUp, this);
		this._activeInput.un('change', this._onFileSelected, this);
		
		this._queue.add(value, file );
		this.fireEvent('filequeued', this._queue.get(value) );
		this._createActiveFileInput();
		
	},
	
	_upload : function(){
		var finished = true;
		var requests = 0;
		this._queue.each( function(file,index,key){
			if( file.uploading ){
				finished = false;
				requests++;
				return false;
			}
			if( file.uploaded ){
				return true;
			}
			var form = file.form;
			var el = file.el;
			el.dom.name=this._paramKeys.file;
			
			form.submit({
				url		: this._url,
				params 	: this.extraParams || {},
				success : this._onUploadSuccess.createDelegate(this,[file],0),
				failure : this._onUploadFailure.createDelegate(this,[file],0)
			});
			
			this.fireEvent('uploadstart',file);
			file.uploading = true;
			finished = false;
			requests++;
			return this.maxRequests && requests < this.maxRequests;
		}, this );
		if( finished !== false ){
			this.fireEvent('queuecomplete');
		}
	},
	
	_onUploadSuccess : function(file,form,action){
		file = this._queue.removeKey(file.id);
		file.form.getEl().remove();
		delete file.form;
		this.fireEvent('uploadcomplete',file);
		file.uploaded = true;
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
	}
});

Ext.ux.uploader.AdapterFactory.reg('html', Ext.ux.uploader.HtmlAdapter);
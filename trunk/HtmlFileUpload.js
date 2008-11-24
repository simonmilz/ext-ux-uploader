Ext.ux.uploader.HtmlFileUpload = Ext.extend( Ext.ux.uploader.AbstractFileUpload, {
	
	_init : function(){
		this._uploading = false;
		this._complete = false;
		// create a form for this bad boy...
		var formEl = this.uploader.get('queueEl').createChild({
			'tag' : 'form'
		});
		var form = new Ext.form.BasicForm( formEl,{
			fileUpload			:true,
			errorReader			:this.uploader.get('errorReader')
		});
		// move the input out of button and create a new one...		
		this.form = form;
		this.input.appendTo( formEl );
	},
	
	_onUploadSuccess : function(){
		this._uploading = false;
		this._complete = true;
		this.fireEvent('uploadsuccess', this);
	},
	
	_onUploadFailure : function(){
		this._uploading = false;
		this.fireEvent('uploadfailure', this);
	},
	
	start : function(){
		this.input.dom.name=this.uploader.get('paramKeys').file;
		this.form.submit({
			url		:this.uploader.get('url'),
			params 	:this.uploader.extraParams || {},
			scope	:this,
			success :this._onUploadSuccess,
			failure :this._onUploadFailure
		});
		this._uploading = true;
		this.fireEvent('uploadstart', this);
	},
	
	destroy : function(){
		this.form.getEl().remove();
	},
	
	isUploading : function(){
		return this._uploading;
	},
	
	isComplete : function(){
		return this._complete;
	},
	
	getId : function(){
		return this.id;
	},
	
	getFilename : function(){
		return this.filename;
	}
	
});
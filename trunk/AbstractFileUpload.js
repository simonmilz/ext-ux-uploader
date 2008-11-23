Ext.namespace('Ext.ux.uploader');

Ext.ux.uploader.AbstractFileUpload = function(config){
	Ext.ux.uploader.AbstractFileUpload.superclass.constructor.call(this);
	this.addEvents({
		'uploadstart'		:true,
		'uploadsuccess'		:true,
		'uploadpause'		:true,
		'uploadfailure'		:true,
		'uploaderror'		:true
	});
	this._initialConfig = config;
	Ext.apply(this,config);
	this._init();
	this._vars = {};
};
Ext.extend(Ext.ux.uploader.AbstractFileUpload, Ext.util.Observable, {
	
	_init : function(){
		
	},
	
	getType : function(){
		var name = this.getFilename();
		var matches = name.match(/\.([a-zA-Z0-9]*)$/);
		var type = matches ? Ext.ux.uploader.AbstractFileUpload.TYPES[matches[1].toLowerCase()] : null;
		return type || 'unknown';
	},
	
	start : function(){
		
	},
	
	stop : function(){
		
	},
	
	getId : function(){
		return '';
	},
	
	setVar : function(key,value){
		this._vars[key] = value;
	},
	
	getVar : function(key){
		return this._vars[key];
	},
	
	getFilename : function(){
		return '';
	},
	
	isUploading : function(){
		return false;
	},
	
	isComplete : function(){
		return false;
	},
	
	isPaused : function(){
		return false;
	},
	
	getUploadedBytes : function(){
		return 0;
	},
	
	getTotalBytes : function(){
		return 0;
	},
	
	getPercentUploaded : function(){
		return 0;
	}
	
});

Ext.ux.uploader.AbstractFileUpload.TYPES = {
	// Images
	'jpg'	:'image',
	'gif'	:'image',
	'png'	:'image',
	
	// Documents
	'rtf'	:'document',
	'doc'	:'document',
	'docx'	:'document',
	
	// Acrobat
	'pdf'	:'acrobat'
};
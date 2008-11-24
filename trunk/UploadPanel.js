Ext.namespace('Ext.ux.uploader');

Ext.ux.uploader.Panel = Ext.extend( Ext.Panel, {
	
	initComponent : function(){
		this._addFilesBtn = new Ext.Button({
			text 		:'Add Files',
			cls			:'x-btn-text-icon',
			iconCls		:'add-icon'
		});
		
		if( this.usePreview ){
			this.previewWidth = this.previewWidth || 50;
			this.previewHeight = this.previewHeight || 40;
		}
		
		this.autoScroll = this.autoScroll === false ? false : true;
		
		this._adapterType = this.adapter || this.adapterType || 'html';
		
		this._uploader = Ext.ux.uploader.AdapterFactory.create(this._adapterType,
			Ext.apply({
				button 		:this._addFilesBtn,
				url 		:'?',
				maxRequests : 1,
				chunkLength : 51200
			}, this.initialConfig )
		);
		
		if( !this._uploader ){
			throw "Uploader Adapter could not be found: "+this._adapterType;
		}
		this._uploadBtn = new Ext.Button({
			text 			:'Upload',
			handler			:this._uploader.upload,
			scope			:this._uploader,
			cls				:'x-btn-text-icon',
			iconCls			:'upload-icon',
			disabled		:true
		});
		this.tbar = [this._addFilesBtn, '-', this._uploadBtn];
		
		this._statusBar = new Ext.StatusBar({
			defaultText : '',
			busyText : 'Uploading...'/*,
			items : ['->',{
				text : 'info'
			}]
			*/
		});
		this.bbar = this._statusBar;
		
		if( !this.entryTpl ){
			this.entryTpl = new Ext.XTemplate(
				'<div class="x-upload-panel-entry">',
					'<div class="x-upload-panel-entry-pad">',
						
						'<div class="x-upload-panel-entry-buttons"></div>',
						'<div class="x-upload-panel-entry-preview"></div>',
						'<div class="x-upload-panel-entry-icon"><span class="x-upload-panel-icon"></span></div>',
						
						'<div class="x-upload-panel-entry-progress"></div>',
						'<div class="x-upload-panel-entry-title">',
							'<span>{name}</span>',
						'</div>',
						'<div class="x-upload-panel-entry-clear"></div>',
					'</div>',
				'</div>'
			);
		}
		
		this._uploader.on('filequeued', this._onFileQueued, this);
		this._uploader.on('fileremoved', this._onFileRemoved, this);
		this._uploader.on('queueerror', this._onQueueError, this);
		this._uploader.on('queueempty', this._onQueueEmpty, this);
		this._uploader.on('uploadstart', this._onUploaderStart, this);
		this._uploader.on('uploadstop', this._onUploaderStop, this);
		
		Ext.ux.uploader.Panel.superclass.initComponent.call(this);
	},
	
	_onFileQueued : function(fileUpload){
		
		// listen to this file...
		fileUpload.on('uploadprogress', this._onFileUploadProgress, this);
		fileUpload.on('uploadstart', this._onFileUploadStart, this);
		
		// create an entry in the queue
		var name = fileUpload.getFilename();
		if( this._uploader.hasFeature('filesize') ){
			name+=' ('+fileUpload.getSize(true)+')';
		}
		var el = Ext.get(this.entryTpl.append(this.body,{name:name}));
		this._initEntry(el, fileUpload);
		fileUpload.setVar('panelEl', el);
		this._uploadBtn.enable();
		this.doLayout();
	},
	
	_onFileRemoved : function(fileUpload){
		var el = fileUpload.getVar('panelEl').remove();
		delete el;
	},
	
	_initEntry : function(el, fileUpload){
		el.buttons 	= el.child('.x-upload-panel-entry-buttons');
		el.progress = el.child('.x-upload-panel-entry-progress');
		el.title 	= el.child('.x-upload-panel-entry-title');
		el.icon		= el.child('.x-upload-panel-entry-icon');
		el.preview	= el.child('.x-upload-panel-entry-preview');
		el.pad 		= el.child('.x-upload-panel-entry-pad');
		
		// try to add the icon...
		var type = fileUpload.getType();
		if( type !== 'unknown'){
			el.icon.addClass(type+'-icon');
		}
		// can we preview this file and are previews enabled?
		if( fileUpload.canPreview() && this.usePreview ){
			
			el.preview.setStyle({display: 'block'});
			el.icon.setStyle({display: 'none'});
			
			var img = new Image();
			img.onload = function(){
				var w = img.width, h = img.height, w2,h2;
				if( w > h ){
					w2 = this.previewWidth;
					h2 = parseInt(img.height * ( this.previewWidth / w));
				}else{
					h2 = this.previewHeight;
					w2 = parseInt(img.width * ( this.previewHeight / h));
				}
				el.preview.createChild({
					tag : 'img',
					src : fileUpload.getPreviewUrl(),
					width : w2,
					height: h2
				});
			}.createDelegate(this);
			img.src = fileUpload.getPreviewUrl();
		}
		
		// add the remove button...
		el.removeIcon = el.buttons.createChild({
			'tag'		:'img',
			'src'		:Ext.BLANK_IMAGE_URL,
			'cls'		:'icon remove-icon'
		});
		el.removeIcon.on('click', function(){
			this._uploader.remove(fileUpload);
		}, this);
	},
	
	_onQueueError : function(errors){
		var text = '';
		if(errors.length > 1){
			// multiple files.
			text = 'Error adding some of the selected files';
		}else{
			text = errors[0].name+': '+errors[0].message;
		}
		this._statusBar.setStatus({
			text		:text,
			iconCls		:'error-icon',
			clear		:{
				wait		:3000,
				anim		:true
			}
		});
	},
	
	_onFileUploadStart : function(fileUpload){
		var el = fileUpload.getVar('panelEl');
		el.icon.removeClass('page-icon');
		el.icon.addClass('loading-icon');
		if( !this._uploader.hasFeature('progress') ){
			el.addClass('loading-bg');
		}
	},
	
	_onUploaderStart : function(uploader){
		this._statusBar.showBusy();
	},
	
	_onUploaderStop : function(uploader){
		this._statusBar.clearStatus({useDefaults:true});
	},
	
	_onQueueEmpty : function(uploader){
		this._uploadBtn.disable();
	},
	
	_onFileUploadProgress : function(fileUpload, info){
		var el = fileUpload.getVar('panelEl');
		var pad = Ext.fly(el).child('.x-upload-panel-entry-pad');
		var progress = Ext.fly(el).child('.x-upload-panel-entry-progress');
		el.progress.setHeight(el.pad.getHeight());
		el.progress.setWidth(el.pad.getWidth() * info.percent );
	},
	
	browse : function(){
		this._uploader.browse();
	}
	
});
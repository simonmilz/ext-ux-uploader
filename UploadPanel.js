Ext.namespace('Ext.ux.uploader');

Ext.ux.uploader.Panel = Ext.extend( Ext.Panel, {
	
	initComponent : function(){
		// create the uploader
		
		this._queue = new Ext.util.MixedCollection();
		
		this._addFilesBtn = new Ext.Button({
			text 		:'Add Files',
			cls			:'x-btn-text-icon',
			iconCls		:'add-icon'
		});
		
		this._adapterType = this.adapter || this.adapterType || 'html';
		
		this._adapter = Ext.ux.uploader.AdapterFactory.create(this._adapterType,
			Ext.apply({
				button 		:this._addFilesBtn,
				url 		:'?',
				maxRequests : 1,
				chunkLength : 51200
			}, this.initialConfig)
		);
		
		if( !this._adapter ){
			throw "Uploader Adapter could not be found: "+this._adapterType;
		}
		this._uploadBtn = new Ext.Button({
			text 			:'Upload',
			handler			:this._adapter.upload,
			scope			:this._adapter,
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
		
		this.relayEvents(this._adapter,[
			'filequeued',
			'queuecomplete',
			'uploadcomplete'
		]);
		
		if( !this.entryTpl ){
			this.entryTpl = new Ext.XTemplate(
				'<div class="x-upload-panel-entry">',
					'<div class="x-upload-panel-entry-pad">',
						'<div class="x-upload-panel-entry-icon page-icon"><span class="x-upload-panel-icon"></span></div>',
						'<div class="x-upload-panel-entry-buttons"></div>',
						'<div class="x-upload-panel-entry-progress"></div>',
						'<div class="x-upload-panel-entry-title">',
							'<span>{name}</span>',
						'</div>',
					'</div>',
				'</div>'
			);
		}
		
		this._adapter.on('filequeued', this._onFileQueued, this);
		this._adapter.on('queueerror', this._onQueueError, this);
		this._adapter.on('uploadcomplete', this._onUploadComplete, this);
		this._adapter.on('uploadstart', this._onUploadStart, this);
		this._adapter.on('uploadprogress', this._onUploadProgress, this);
		//this._uploader.on('queuecomplete', this._onQueueComplete, this);
		
		Ext.ux.uploader.Panel.superclass.initComponent.call(this);
	},
	
	_onFileQueued : function(file){
		var name = file.data.name;
		// create an entry in the queue
		var el = Ext.get(this.entryTpl.append(this.body,{name:name}));
		this._initEntry(file,el);
		this._queue.add(file.id,el);
		this._uploadBtn.enable();
		this.doLayout();
	},
	
	_initEntry : function(el,file){
		el.buttons 	= el.child('.x-upload-panel-entry-buttons');
		el.progress = el.child('.x-upload-panel-entry-progress');
		el.title 	= el.child('.x-upload-panel-entry-title');
		el.icon		= el.child('.x-upload-panel-entry-icon');
		if( this._adapter.hasFeature('filesize') ){
			// file.
		}
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
	
	_onUploadStart : function(file){
		var el = this._queue.get(file.id);
		var icon = el.child('.x-upload-panel-entry-icon');
		icon.removeClass('page-icon');
		icon.addClass('loading-icon');
		this._statusBar.showBusy();
	},
	
	_onUploadComplete : function(file){
		this._statusBar.clearStatus({useDefaults:true});
		var el = this._queue.removeKey(file.id);
		this._uploadBtn.disable();
		Ext.fly(el).remove();
	},
	
	_onUploadProgress : function(file, info){
		var el = this._queue.get(file.id);
		var pad = Ext.fly(el).child('.x-upload-panel-entry-pad');
		var progress = Ext.fly(el).child('.x-upload-panel-entry-progress');
		if(progress && pad){
			progress.setHeight(pad.getHeight());
			progress.setWidth(pad.getWidth() * info.percent );
		}
	}
	
});
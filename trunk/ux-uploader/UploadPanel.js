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
		
		this.tbar = [this._addFilesBtn, '-', {
			text 			:'Upload',
			handler			:this._adapter.upload,
			scope			:this._adapter,
			cls				:'x-btn-text-icon',
			iconCls			:'upload-icon'
		}];
		
		this._statusBar = new Ext.StatusBar({
			defaultText : 'Waiting.',
			busyText : 'Uploading...'/*,
			items : ['->',{
				text : 'info'
			}]
			*/
		});
		this.bbar = this._statusBar
		
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
		this._adapter.on('uploadcomplete', this._onUploadComplete, this);
		this._adapter.on('uploadstart', this._onUploadStart, this);
		this._adapter.on('uploadprogress', this._onUploadProgress, this);
		//this._uploader.on('queuecomplete', this._onQueueComplete, this);
		
		Ext.ux.uploader.Panel.superclass.initComponent.call(this);
	},
	
	_onFileQueued : function(file){
		var name = file.data.name;
		// create an entry in the queue
		var el = this.entryTpl.append(this.body,{name:name});
		this._queue.add(file.id,el);
		this.doLayout();
	},
	
	_onUploadStart : function(file){
		var el = this._queue.get(file.id);
		var icon = Ext.fly(el).child('.x-upload-panel-entry-icon');
		icon.removeClass('page-icon');
		icon.addClass('loading-icon');
		this._statusBar.showBusy();
	},
	
	_onUploadComplete : function(file){
		this._statusBar.clearStatus({useDefaults:true});
		var el = this._queue.removeKey(file.id);
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
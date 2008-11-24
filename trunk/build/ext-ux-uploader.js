Ext.namespace('Ext.ux.uploader');

Ext.ux.uploader.AbstractAdapter = function(config){
    
    Ext.ux.uploader.AbstractAdapter.superclass.constructor.call(this);
    
    this._initialConfig = config;
    Ext.apply(this,config);
    this.addEvents({
        /* upload events for the entire upload process */
        'uploadstart'            :true,
        'uploadstop'            :true,
        'uploadprogress'        :true,
        'queueerror'            :true,
        'queueempty'            :true,
        'filequeued'            :true,
        'fileremoved'            :true,
        'queuecomplete'            :true
    });
    
    this._features = {
        /* These are the features for the basic HTML upload */
        'queue'                    :true,
        'progress'                :false,
        'pausequeue'            :true,
        'pauseupload'            :false,
        'filesize'                :false
    };
    
    this._init();
};

Ext.extend(Ext.ux.uploader.AbstractAdapter, Ext.util.Observable,{
    
    lang : {
        INVALID_FILETYPE        :'Invalid File Type',
        EXCEEDS_MAXSIZE            :'File exceeds maximum size of {0}'
    },
    
    _validFileName : function(filename){
        // check extensions etc..
        var ret=true;
        if( filename==''){
            return false;
        }
        if(this.filter && Ext.type(this.filter)=='regexp'){
            ret=this.filter.test(filename);
            if(!ret){return false;}
        }else if(this.filter && Ext.type(this.filter)=='string'){
            if( !this.filters ){
                this.filters = [this.filter];
            }else if(Ext.type(this.filters)=='array'){
                this.filters[this.filters.length] = this.filter;
            }
        }
        if(this.filters && Ext.type(this.filters)=='array'){
            var re = new RegExp(("("+this.filters.join('|')+")$").replace(/\./,'\.'),'i');
            ret = re.test(filename);
        }
        return ret;
    },
    
    _basename : function(path){
        var b = path.replace(/^.*[\/\\]/g, '');    
        if (typeof(suffix) == 'string' && b.substr(b.length-suffix.length) == suffix) {
            b = b.substr(0, b.length-suffix.length);
        }
        return b;
    },
    
    _init : function(){
        
    },
    
    hasFeature : function(featureName){
        return this._features[featureName];
    },
    
    browse : function(){
        // implement browse if possible.
    },
    
    upload : function(params){
        // start an upload with an additional parameters
    },
    
    clearQueue : function(){
        // empty the queue.
    },
    
    stop : function(force){
        // stop the queued uploads
    },
    
    remove : function(fileUpload){
        
    },
    
    removeAt : function(index){
        // remove a file from the queue
    },
    
    clearQueue : function(){
        
    },
    
    getQueue : function(){
        // return queue
    },
    
    getCompleted : function(){
        
    },
    
    get : function(key,defaultValue){
        var privateKey = '_'+key; 
        if( this[privateKey] ){
            return this[privateKey];
        }
        return Ext.type(defaultValue) == 'undefined' ? false : defaultValue;
    }
    
});
Ext.ux.uploader.AdapterFactory= (function(){
    
    var registry = {};
    
    return {
        register : function(type,obj){
            registry[type] = obj;
        },
        reg : function(type,obj){
            this.register(type,obj);
        },
        create : function(type, config){
            if( !registry[type] ){
                throw 'Uploader Type "'+type+'" is not registered';
            }else{
                var obj = new registry[type](config);
                obj.type = type;
                return obj;
            }
        }
    };
})();Ext.ux.uploader.AbstractFileUpload = function(config){
    Ext.ux.uploader.AbstractFileUpload.superclass.constructor.call(this);
    this.addEvents({
        'uploadstart'        :true,
        'uploadsuccess'        :true,
        'uploadpause'        :true,
        'uploadfailure'        :true,
        'uploaderror'        :true
    });
    this._initialConfig = config;
    Ext.apply(this,config);
    this._init();
    this._vars = {};
};
Ext.extend(Ext.ux.uploader.AbstractFileUpload, Ext.util.Observable, {
    
    _init : function(){
        
    },
    
    getExt : function(){
        var name = this.getFilename();
        var matches = name.match(/\.([a-zA-Z0-9]*)$/);
        return (matches ? matches[1] : '').toLowerCase();
    },
    
    getType : function(){
        return Ext.ux.uploader.AbstractFileUpload.TYPES[this.getExt()] || 'unknown';
    },
    
    canPreview : function(){
        return false;
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
    
    getSize : function(){
        return Ext.ux.uploader.Util.getSize(this.getTotalBytes());
    },
    
    getPercentUploaded : function(){
        return 0;
    }
    
});

Ext.ux.uploader.AbstractFileUpload.TYPES = {
    // Images
    'jpg'    :'image',
    'gif'    :'image',
    'png'    :'image',
    
    // Documents
    'rtf'    :'document',
    'doc'    :'document',
    'docx'    :'document',
    
    // Acrobat
    'pdf'    :'acrobat'
};Ext.ux.uploader.Util = {
    getSize : function(bytes){
        var sizes = ['KB','MB','GB'];
        for(var i=sizes.length-1; i>=0; i--){
            var s= 1024;
            for(var x=0;x<i;x++){
                s*=1000;
            }
            if( bytes > s ){
                var s = bytes / s;
                s = parseInt(s*100)/100;
                return s+' '+sizes[i];
            }
        }
        return bytes+' bytes';
    }
};Ext.ux.uploader.HtmlAdapter = Ext.extend( Ext.ux.uploader.AbstractAdapter, {
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
            'filename'    :'filename',
            'file'        :'file'
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
                        "success"    :false,
                        "message"    :"Invalid response. Expected JSON string.",
                        "response"    :r.responseText
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
            tag            :'input',
            type        :'file',
            cls            :'x-form-file',
            size        :1
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
                name    :value,
                message    :this.lang.INVALID_FILETYPE
            }]);
            return;
        }
        
        this._activeInput.un('mousedown', this._onMouseDown, this);
        this._activeInput.un('mouseup', this._onMouseUp, this);
        this._activeInput.un('change', this._onFileSelected, this);
        
        var fileUpload = new Ext.ux.uploader.HtmlFileUpload({
            id            :value,
            filename    :value,
            uploader     :this,
            input        :this._activeInput
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
    },
    
    clearQueue : function(){
        this._queue.each( function(o){
            this._queue.remove(o);
            o.destroy();
        },this);
    }
    
});

Ext.ux.uploader.AdapterFactory.reg('html', Ext.ux.uploader.HtmlAdapter);Ext.ux.uploader.HtmlFileUpload = Ext.extend( Ext.ux.uploader.AbstractFileUpload, {
    
    _init : function(){
        this._uploading = false;
        this._complete = false;
        // create a form for this bad boy...
        var formEl = this.uploader.get('queueEl').createChild({
            'tag' : 'form'
        });
        var form = new Ext.form.BasicForm( formEl,{
            fileUpload            :true,
            errorReader            :this.uploader.get('errorReader')
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
            url        :this.uploader.get('url'),
            params     :this.uploader.extraParams || {},
            scope    :this,
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
    
});Ext.ux.uploader.GearsAdapter = Ext.extend( Ext.ux.uploader.AbstractAdapter, {
    console : window.console || {log:Ext.emptyFn},
    _init : function(){
        
        this._uploading = false;
        
        Ext.apply(this._features, {
            'pauseupload'    :true,
            'filesize'        :true,
            'progress'        :true
        });
        
        this._paramKeys = Ext.apply({
            'filename'        :'filename',
            'start'            :'start',
            'end'            :'end',
            'total'            :'total',
            'length'        :'length'
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
                    name    :files[i].name
                };
                continue;
            }
            if( !this._validFileName( files[i].name) ){
                errors[errors.length] = {
                    message    :this.lang.INVALID_FILETYPE,
                    name    :files[i].name
                };
                continue;
            }
            
            var fileUpload = new Ext.ux.uploader.GearsFileUpload({
                id            :sig,
                uploader    :this,
                file        :files[i],
                filename    :this._basename(files[i].name)
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
Ext.ux.uploader.AdapterFactory.reg('gears', Ext.ux.uploader.GearsAdapter);Ext.ux.uploader.GearsFileUpload = Ext.extend( Ext.ux.uploader.AbstractFileUpload, {
    
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
        if( this.canPreview() && this.uploader.usePreview ){
            try{
                var localServer = google.gears.factory.create('beta.localserver');
                var store = localServer.createStore('ux-uploader-gears-adapter');
                this._previewUrl = this.getFilename()+this.getFilesize();
                /* The third argument is available in 0.5 */
                store.captureBlob( this.file.blob, this._previewUrl /* , 'image/'+this.getExt() */ );
            }catch(e){
                console.log(e.message);
            }
        }
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
        info.start         = this._uploaded+(this._requestProgress);
        info.total         = this.file.blob.length;
        info.end         = Math.min(info.start + ( this._fullUpload ? info.total : this._chunkLength), info.total );
        info.percent    = info.start/info.total;
        return info;
    },
    
    _sendChunk : function(){
        
        var info=this._getUploadInfo();
        if( this._request ) delete this._request;
        this._request = google.gears.factory.create('beta.httprequest');
        this._request.onreadystatechange = this._onReadyStateChange.createDelegate(this);
        this._request.upload.onprogress = this._onUploadProgress.createDelegate(this);

        var h = {
            'Content-Disposition'     : "attachment; filename='"+this.getFilename()+"'",
            'Content-Type'            : "application/octet-stream",
            'Content-Range'            : "bytes "+info.start+"-"+info.end+"/"+info.total
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
    
    getPreviewUrl : function(){
        return this._previewUrl || false;
    },
    
    getFilename : function(){
        return this.filename;
    },
    
    getFilesize : function(){
        return this.file.blob.length;
    },
    
    destroy : function(){
        if( this.canPreview() && this.uploader.usePreview ){
            var localServer = google.gears.factory.create('beta.localserver');
            var store = localServer.createStore('ux-uploader-gears-adapter');
            store.remove( this.getPreviewUrl() );
        }
    },
    
    getTotalBytes : function(){
        return this.file.blob.length;
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
    
    canPreview : function(){
        return this.getType() == 'image';
    }
    
});Ext.ux.uploader.Panel = Ext.extend( Ext.Panel, {
    
    initComponent : function(){
        this._addFilesBtn = new Ext.Button({
            text         :'Add Files',
            cls            :'x-btn-text-icon',
            iconCls        :'add-icon'
        });
        
        if( this.usePreview ){
            this.previewWidth = this.previewWidth || 50;
            this.previewHeight = this.previewHeight || 40;
        }
        
        this.autoScroll = this.autoScroll === false ? false : true;
        
        this._adapterType = this.adapter || this.adapterType || 'html';
        
        this._uploader = Ext.ux.uploader.AdapterFactory.create(this._adapterType,
            Ext.apply({
                button         :this._addFilesBtn,
                url         :'?',
                maxRequests : 1,
                chunkLength : 51200
            }, this.initialConfig )
        );
        
        if( !this._uploader ){
            throw "Uploader Adapter could not be found: "+this._adapterType;
        }
        this._uploadBtn = new Ext.Button({
            text             :'Upload',
            handler            :this._uploader.upload,
            scope            :this._uploader,
            cls                :'x-btn-text-icon',
            iconCls            :'upload-icon',
            disabled        :true
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
        
        // expose some uploader methods and events
        this.exposeMethods(this._uploader,[
            'browse',
            'upload'
        ]);
        this.relayEvents(this._uploader,[
            'queuecomplete',
            'uploadstart',
            'uploadstop',
            'queueempty',
            'filequeued'
        ]);
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
        
        el.buttons     = el.child('.x-upload-panel-entry-buttons');
        el.progress = el.child('.x-upload-panel-entry-progress');
        el.title     = el.child('.x-upload-panel-entry-title');
        el.icon        = el.child('.x-upload-panel-entry-icon');
        el.preview    = el.child('.x-upload-panel-entry-preview');
        el.pad         = el.child('.x-upload-panel-entry-pad');
        
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
            'tag'        :'img',
            'src'        :Ext.BLANK_IMAGE_URL,
            'cls'        :'icon remove-icon'
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
            text        :text,
            iconCls        :'error-icon',
            clear        :{
                wait        :3000,
                anim        :true
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
        this._uploadBtn.disable();
        this._statusBar.showBusy();
    },
    
    _onUploaderStop : function(uploader){
        this._uploadBtn.enable();
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
    
    exposeMethods : function(object, methods){
        if( Ext.type(methods) == 'string' ){
            methods = [methods];
        }
        if( !Ext.type(methods) == 'array'){
            return;
        }
        for(var i = 0; i < methods.length; i++ ){
            var m = methods[i];
            this[m]=object[m].createDelegate(object);
        }
    },
    
    browse : function(){
        this._uploader.browse();
    }
    
});
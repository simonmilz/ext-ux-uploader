Ext.ux.uploader.HtmlFileUpload = Ext.extend( Ext.ux.uploader.AbstractFileUpload, {
    
    _init : function(){
        this._uploading = false;
        this._complete = false;
        // create a form for this bad boy...
        var formEl = this.uploader.get('queueEl').createChild({
            'tag' : 'form'
        });
        var form = new Ext.form.BasicForm( formEl,{
            fileUpload             :true,
            errorReader            :this.uploader.get('errorReader')
        });
        // move the input out of button and create a new one...        
        this.form = form;
        this.input.appendTo( formEl );
    },
    
    _onUploadSuccess : function(form, action){
        this._uploading = false;
        this._complete = true;
        this.fireEvent('uploadsuccess', this, form, action );
    },
    
    _onUploadFailure : function(form, action){
        this._uploading = false;
        this._error = 'Error'; // need to be more specific
        this.fireEvent('uploadfailure', this, form, action );
    },
    
    start : function(){
        this.input.dom.name=this.uploader.get('paramKeys').file;
        var p = Ext.apply(this.uploader.extraParams||{});
        p[this.uploader.get('paramKeys').filename]=this.getFilename();
        this.form.submit({
            url         :this.uploader.get('url'),
            params      :p,
            scope       :this,
            success     :this._onUploadSuccess,
            failure     :this._onUploadFailure
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
    
    isError : function(){
        return this._error ? true : false;
    },
    
    getId : function(){
        return this.id;
    },
    
    getFilename : function(){
        return this.filename;
    }
    
});
Ext.namespace('Ext.ux.uploader');

Ext.ux.uploader.AbstractAdapter = function(config){
	
	Ext.ux.uploader.AbstractAdapter.superclass.constructor.call(this);
	Ext.apply(this,config);
	this.addEvents({
		/* upload events */
		'uploadstart'			:true,
		'uploadcomplete'		:true,
		'uploaderror'			:true,
		'uploadprogress'		:true,
		
		/* queue events */
		'filequeued'			:true,
		'filequeueerror'		:true,
		'queuecomplete'			:true
	});
	
	this._init();
};

Ext.extend(Ext.ux.uploader.AbstractAdapter, Ext.util.Observable,{
	
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
	
	browse : function(){
		// implement browse if possible.
	},
	
	upload : function(params){
		// start an upload with an additional parameters
	},
	
	clearQueue : function(){
		// empty the queue.
	},
	
	removeAt : function(index){
		// remove a file from the queue
	},
	
	getQueue : function(){
		// return queue
	},
	
	getCompleted : function(){
		
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
})();
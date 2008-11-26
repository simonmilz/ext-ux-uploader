Ext.onReady(function(){
    Ext.BLANK_IMAGE_URL = '../resources/s.gif';
    var MAXSIZE = 2048000;
    
    if (!window.google || !google.gears) {
        
        Ext.MessageBox.confirm(
            "Gears Dialog",
            "This website has additional upload functionality "+
            "that requires the Google Gears plugin. "+
            "Would you like to take a minute to install Google Gears and "+
            "experience enhanced uploads?",
            function(btn){
                if(btn=='ok'||btn=='yes'){
                    var message = "Gears will allow you upload multiple images with ease!";
                    location.href = [
                        "http://gears.google.com/?action=install",
                        "&message="+encodeURIComponent(message),
                        "&return="+location.href
                    ].join('');
                }
            }
        );
        
    }
    
    else{
        
        var panel1 = new Ext.ux.uploader.Panel({
            adapter             :'gears',
            extraParams         :{adapter:'gears'},
            width               :300,
            height              :250,
            maxSize             :MAXSIZE,
            maxRequests         :4,
            title               :'Gears Panel',
            renderTo            :"gears-panel",
            fullUpload          :true,
            filters             :['.jpg','.png','.gif','.pdf','.rtf','.doc','.docx']
        });
        var panel2 = new Ext.ux.uploader.Panel({
                adapter         :'gears',
                extraParams     :{adapter:'gears'},
                maxRequests     :2,
                maxSize         :MAXSIZE,
                usePreview      :true,
                imagesOnly      :true,
                border          :false,
                fullUpload      :true
            });
        
        var gearsWindow = new Ext.Window({
            id              :'gears-window',
            title           :'Gears Window',
            layout          :'fit',
            width           :400,
            height          :300,
            items           :[panel2],
            closeAction     :'hide'
        });
        
        var gearsButton = new Ext.Button({
        
            text: 'Launch Gears Uploader Window with Image Preview',
            handler : function(){
                gearsWindow.show();
            },
            renderTo        :'gears-button'
        });
    }
    
    var panel3 = new Ext.ux.uploader.Panel({
        adapter         :'html',
        extraParams     :{adapter:'html'},
        width           :300,
        height          :250,
        maxRequests     :1,
        title           :'Html Panel',
        renderTo        :"html-panel",
        filters         :['.jpg','.gif','.png']
    });
    
    var panel4 = new Ext.ux.uploader.Panel({
            adapter         :'html',
            extraParams     :{adapter:'html'},
            maxRequests     :2,
            border          :false,
            fullUpload      :true,
            filters         :['.jpg','.png','.gif','.pdf','.rtf','.doc','.docx']
        });
    
    var htmlWindow = new Ext.Window({
        id              :'html-window',
        title           :'Html Window',
        layout          :'fit',
        width           :400,
        height          :300,
        items           :[panel4],
        closeAction     :'hide'
    });    
    
    var htmlButton = new Ext.Button({
        
        text: 'Launch Html In Window',
        handler : function(){
            htmlWindow.show();
        },
        renderTo        :'html-button'
    });
    
    
});
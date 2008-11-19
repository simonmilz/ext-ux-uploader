<?php
if( @$_REQUEST['adapter'] == 'html' ){
	$f = @$_FILES['file'];
	//print_r($_FILES);
	$success = 'false';
	@mkdir("./junk");
	if( $f ){
		$success = 'true';
		$n = $f['name'];
		// @move_uploaded_file($f['tmp_name'], "./junk/$n");
	}
	echo "<html><body>{success:$success}</body></html>";
	exit(0);
}

if( @$_REQUEST['adapter'] == 'gears' ){
	
	header('Content-Type:text/json');
	echo "{";
	
	if( isset($_POST['multipart']) ){
		$file = $_FILES['file'];
		$filename = $_REQUEST['filename'];
		move_uploaded_file($file['tmp_name'], "./$filename" );
		
	}else{
		
		$fd = fopen("php://input", "r");
		$filename = $_REQUEST['filename'];
		
		foreach($_REQUEST as $key => $v ){
		//	echo '"'.$key.'":"'.$v.'",';
		}
		
		$complete = $_REQUEST['end'] == $_REQUEST['total'];
		$tmp = $filename.'.part';
		
		@mkdir("./junk");
		/*
		while( $data = fread( $fd, 8192 ) ){
			file_put_contents( "./junk/{$tmp}", $data, FILE_APPEND );
		}
		
		if( $complete ){
			if( file_exists("./junk/$filename") ){
				@unlink( "./junk/$filename");
			}
			@rename("./junk/$tmp","./junk/$filename");
		}
		*/
	}
	echo '"success":true}';
	exit(0);
}
// for debug purposes...
if( !empty( $_REQUEST['viewraw']) ){
	require(dirname(__FILE__).'/http_request.php');
	header('Content-Type:text/plain');
	$hr = new http_request();
	echo $hr->raw();
	echo "\r\n\r\n";
	echo "\n".$_REQUEST['end'];
	echo "Body length: ".strlen($hr->body());
	exit(0);
}

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html> 
<head> 
<title>Hello World for the File System API</title>
<style type="text/css">
.progress{
	width: 200px;
	border: 1px solid #ccc;
}
.progress-fill{
	background-color: blue;
	height: 10px;
	width: 0px;
}
</style>

<link rel="stylesheet" type="text/css" href="http://extjs.cachefly.net/ext-2.2/resources/css/ext-all.css" />
<link rel="stylesheet" type="text/css" href="../ux-uploader/uploader.css" />

<script type="text/javascript" src="http://code.google.com/apis/gears/gears_init.js" ></script>
<script type="text/javascript" src="http://extjs.cachefly.net/ext-2.2/adapter/ext/ext-base.js"> </script>
<script type="text/javascript" src="http://extjs.cachefly.net/ext-2.2/ext-all.js"> </script>
<script type='text/javascript' src='../ux-uploader/AbstractAdapter.js'></script>
<script type='text/javascript' src='../ux-uploader/GearsAdapter.js'></script>
<script type='text/javascript' src='../ux-uploader/HtmlAdapter.js'></script>
<script type='text/javascript' src='../ux-uploader/UploadPanel.js'></script>

<!--[if IE]>
<script type='text/javascript' 
        src='http://getfirebug.com/releases/lite/1.2/firebug-lite-compressed.js'></script>
<![endif]-->

<script type="text/javascript">

var loaded=false;
Ext.onReady(function(){
	if(loaded) return;
	loaded=true;
	
	if (!window.google || !google.gears) {
		
		Ext.MessageBox.confirm(
			"Gears Dialog",
			"This website has additional functionality that you are missing out "+
			"on. Would you like to take a minute to install Google Gears and "+
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
		var panel = new Ext.ux.uploader.Panel({
			adapter 		:'gears',
			extraParams		:{adapter:'gears'},
			width			:300,
			height			:200,
			title			:'Gears Panel',
			renderTo		:"gears-panel",
			autoScroll		:true,
			filters			:['.jpg','.png','.gif']
		});
	}
	var panel2 = new Ext.ux.uploader.Panel({
		adapter 		:'html',
		extraParams		:{adapter:'html'},
		width			:300,
		height			:200,
		maxRequests		:10,
		title			:'Html Panel',
		renderTo		:"html-panel",
		autoScroll		:true,
		filters			:['.jpg','.gif','.png']
	});
	
});
</script>


</head>
<body style='font-family:verdana;'>
<div style="padding: 10px;" >
	<div style="float:left;margin: 10px;">
		<div id="gears-panel"></div>
	</div>
	<div style="float:left;margin: 10px;">
		<div id="html-panel"></div>
	</div>
</div>
</body> 
</html> 
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
<title>Ext.ux.Uploader Samples</title>
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
<link rel="stylesheet" type="text/css" href="../resources/uploader.css" />
<style tyle='text/css'>
body{
	font-size:12px;
	font-family: Tahoma;
	padding: 10px;
}
</style>
<script type="text/javascript" src="http://code.google.com/apis/gears/gears_init.js" ></script>
<script type="text/javascript" src="http://extjs.cachefly.net/ext-2.2/adapter/ext/ext-base.js"> </script>
<script type="text/javascript" src="http://extjs.cachefly.net/ext-2.2/ext-all.js"> </script>
<script type='text/javascript' src='../AbstractAdapter.js'></script>
<script type='text/javascript' src='../AbstractFileUpload.js'></script>
<script type='text/javascript' src='../GearsAdapter.js'></script>
<script type='text/javascript' src='../GearsFileUpload.js'></script>
<script type='text/javascript' src='../HtmlAdapter.js'></script>
<script type='text/javascript' src='../HtmlFileUpload.js'></script>
<script type='text/javascript' src='../UploadPanel.js'></script>

<!--[if IE]>
<script type='text/javascript' 
        src='http://getfirebug.com/releases/lite/1.2/firebug-lite-compressed.js'></script>
<![endif]-->

<script type="text/javascript">
<?php include dirname(__FILE__).'/sample.js'; ?>

Ext.onReady(function(){
	var on=false;
	Ext.fly('sourceToggle').on('click', function(){
		Ext.fly('source').setStyle({'display':on?'none':''});
		on=!on;
	});
});
</script>
</head>
<body>

<div style="padding: 10px;" >
	<div style="float:left;margin: 10px;">
		<div id="gears-panel"></div>
	</div>
	<div style="float:left;margin: 10px;">
		<div id="html-panel"></div>
	</div>
	<div style="clear:both;margin: 10px;" id="gears-button"></div>
	<div style="clear:both;margin: 10px;" id="html-button"></div>
</div>

<div style='clear:both;'>
<a style='margin-left: 20px;' href='#source' id='sourceToggle'>Show/Hide Source</a>
<div style='display: none; height: 300px; overflow: auto; margin: 20px; border: 1px solid #ccc; padding: 10px;' id='source'>
<pre style='font-size: 12px;'>
<?php include dirname(__FILE__).'/sample.js'; ?>
</pre>
</div>
</body> 
</html> 
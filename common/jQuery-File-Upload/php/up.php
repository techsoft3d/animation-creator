<?php
/*
 * jQuery File Upload Plugin PHP Example
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

error_reporting(E_ALL | E_STRICT);

class myOptions {

	function get_server_var($id) {
		return isset($_SERVER[$id]) ? $_SERVER[$id] : '';
	}

	function get_full_url() {
		$https = !empty($_SERVER['HTTPS']) && strcasecmp($_SERVER['HTTPS'], 'on') === 0;
		return
		($https ? 'https://' : 'http://').
		(!empty($_SERVER['REMOTE_USER']) ? $_SERVER['REMOTE_USER'].'@' : '').
		(isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ($_SERVER['SERVER_NAME'].
		($https && $_SERVER['SERVER_PORT'] === 443 ||
			$_SERVER['SERVER_PORT'] === 80 ? '' : ':'.$_SERVER['SERVER_PORT']))).
			substr($_SERVER['SCRIPT_NAME'],0, strrpos($_SERVER['SCRIPT_NAME'], '/')
		);
	}

	function uploadDir(){
		return dirname($this->get_server_var('SCRIPT_FILENAME'));
	}

	function uploadUrl(){
		return $this->get_full_url();
	}

}

$myOptions = new myOptions();
$upDirName = '../../../upload';
$upDir = '/' . $upDirName . '/';

$options = array(
	'upload_dir' => $myOptions->uploadDir().$upDir,
	'upload_url' => $myOptions->uploadUrl().$upDir,
	'accept_file_types' => '/(\.|\/)(xml|pdf|stp)$/i',
);

require('UploadHandler.php');
$upload_handler = new UploadHandler($options);

?>

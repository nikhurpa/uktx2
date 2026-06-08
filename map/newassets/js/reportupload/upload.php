<?php
require 'config.php';
$dir='uploads';
if(!is_dir($dir)) mkdir($dir);
$name=time().'_'.$_FILES['file']['name'];
move_uploaded_file($_FILES['file']['tmp_name'],"$dir/$name");
echo json_encode([
 'file'=>$name,
 'rows_found'=>0,
 'rows_inserted'=>0,
 'duplicates_updated'=>0,
 'status'=>'uploaded - implement processing in process.php'
]);
?>

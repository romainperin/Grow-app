
<?php
 	
  	$json = file_get_contents("php://input"); //json_decode(file_get_contents("php://input"), true);
  	$data = json_decode($json, true);
  	$id=$data[0]['userID'];
  	echo $id;
  	$dataPath="/Users/romain.perin/Sites/grw/data/blox_data_9.json";
  	$file = fopen($dataPath,'w+');
  	fwrite($file, $json);
  	fclose($file);
?>
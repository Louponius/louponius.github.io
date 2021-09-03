<?php
$filename = ""; // Change this to the file where your hash is.
$fp = fopen($filename, "r");    
  
$contents = fread($fp, filesize($filename));

$pw = $_POST["pw"];

if (!empty($pw)) {
   $pwhash = hash("sha512",$pw,false);
   if ($pwhash === $contents) {
     echo "Ur logged in.";
   } else {
     echo "Ur not logged in.";
   }
}
?>


<!-- Yes this is copied from W3schools. -->
<form action="index.php" method="post">
<input type="password" placeholder="Hi guys" name="pw" required>
<input type="submit">
</form> 
<?php
header("Access-Control-Allow-Origin: *");
include_once '../config/database.php';

$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    exit("No ID provided");
}

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT photo FROM form_data WHERE id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$id]);

    $photoBlob = $stmt->fetchColumn();

    if ($photoBlob) {
        // Output the image headers
        header("Content-Type: image/jpeg"); // Assuming standard JPEG image from webcam upload
        echo $photoBlob;
        exit();
    } else {
        http_response_code(404);
        exit("Photo not found");
    }
} catch(PDOException $e) {
    http_response_code(500);
    exit("Server Error");
}

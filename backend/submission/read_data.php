<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Embed PHP code from another file
include_once '../config/database.php';
// Initialise
$database = new Database();
$db = $database->getConnection();

try {
    // Display the latest
    $query = "SELECT * FROM form_data ORDER BY id DESC";

    // Prepare() is a more secure method
    $stmt = $db->prepare($query);
    $stmt->execute();

    // Dynamically build the base URL so that it works across different environments (like Railway and Vercel)
    $protocol = (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') || (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    $basePath = rtrim(dirname($_SERVER['REQUEST_URI']), '/');
    $baseUrl = $protocol . $host . $basePath;

    $jobs = [];

    // Store fetched data into $row, 'FETCH_ASSOC' assign key with value: "name" => "John"
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Parse the JSON string to an array
        $personnel_array = [];

        if (!empty($row['team_personnel'])) {

            // 'true' decodes as an associative array
            $parsed = json_decode($row['team_personnel'], true);
            
            if (is_array($parsed)) {
                $personnel_array = $parsed;
            }
        }

        $job = [
            "id" => (string)$row['id'],
            "jobNumber" => $row['job_number'],
            "jobType" => $row['job_type'],
            "siteLocation" => $row['site_location'],
            "completionDate" => $row['completion_date'],
            "completionTime" => $row['completion_time'],
            "contractorCompany" => isset($row['contractor_company']) ? $row['contractor_company'] : '',
            "notes" => isset($row['job_notes']) ? $row['job_notes'] : '',
            "personnelNames" => $personnel_array,
            "huaweiSyncStatus" => isset($row['sync_status']) ? $row['sync_status'] : "pending",
            "teamPhotoUrl" => $baseUrl . "/read_images.php?id=" . $row['id'],
            "createdAt" => isset($row['created_at']) ? $row['created_at'] : $row['completion_date'],
        ];
        
        // Append in array
        array_push($jobs, $job);
    }

    http_response_code(200);
    echo json_encode(["success" => true, "jobs" => $jobs]);
} 
catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "SQL Error: " . $e->getMessage()]);
}

<?php
header("Access-Control-Allow-Origin: https://job-submission-system.vercel.app");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Hanlde OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Embed PHP code from another file
include_once '../config/database.php';

// 显示完整的错误信息（便于开发时调试，正式上线时可以关闭）
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

// Initialise
$database = new Database();
$db = $database->getConnection();

// Get data from frontend
$jobNumber = $_POST['jobNumber'] ?? '';
$jobType = $_POST['jobType'] ?? '';
$siteLocation = $_POST['siteLocation'] ?? '';
$completionDate = $_POST['completionDate'] ?? '';
$completionTime = $_POST['completionTime'] ?? '';
$notes = $_POST['notes'] ?? '';
$contractorCompany = $_POST['contractorCompany'] ?? '';
$personnelNames = $_POST['personnelNames'] ?? [];

// Basic validation
if (empty($jobNumber) || empty($jobType) || empty($siteLocation) || empty($completionDate)
    || empty($completionTime) || empty($contractorCompany) || empty($personnelNames)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit();
}

// Directly store photo value into database
$photoBlob = null;
if (isset($_FILES['photoFile']) && $_FILES['photoFile']['error'] === UPLOAD_ERR_OK) {
    // 'file_get_contents' return binary string then store into LONGBLOB
    $photoBlob = file_get_contents($_FILES['photoFile']['tmp_name']);
}


try {
    $query = "INSERT INTO form_data 
              (job_number, job_type, site_location, completion_date, completion_time, 
               contractor_company, job_notes, photo, team_personnel, sync_status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')";

    $stmt = $db->prepare($query);

    $stmt->execute([
        $jobNumber,
        $jobType,
        $siteLocation,
        $completionDate,
        $completionTime,
        $contractorCompany,
        $notes,
        $photoBlob,
        json_encode($personnelNames, JSON_UNESCAPED_UNICODE),
    ]);

    // Get auto-generated ID
    $newId = $db->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "jobId" => $newId,
        "message" => "Job record and photo successfully saved directly into DB!"
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "SQL Error: " . $e->getMessage()]);
}

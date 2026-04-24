import { submission_datatype, record_datatype } from "../types";
const LOAD_FROM_MYSQL = import.meta.env.VITE_READ_FROM_MYSQL;
const UPLOAD_TO_MYSQL = import.meta.env.VITE_UPLOAD_TO_MYSQL;

export async function submit_form(submission: submission_datatype): 
Promise<{ success: boolean; message?: string; jobId?: string | number; }> {

  const formData = new FormData();
  formData.append('jobNumber', submission.jobNumber);
  formData.append('jobType', submission.jobType);
  formData.append('siteLocation', submission.siteLocation);
  formData.append('completionDate', submission.completionDate);
  formData.append('completionTime', submission.completionTime);
  formData.append('contractorCompany', submission.contractorCompany);
  formData.append('notes', submission.notes);
  submission.personnelNames.forEach(name => formData.append('personnelNames[]', name));

  // Convert base64 to blob (Binary Large Object) for upload
  if (submission.photo) {
    const photo_blob = await fetch(submission.photo).then(r => r.blob());
    formData.append('photoFile', photo_blob, 'team-photo.jpg');
  }

  try {
    const response = await fetch(UPLOAD_TO_MYSQL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
  catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}


export async function read_from_db(): Promise<record_datatype[]> {
  try {
    const response = await fetch(LOAD_FROM_MYSQL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return data.jobs;
    }
    else {
      throw new Error(data.message || "Failed to fetch job records");
    }
  } 
  catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// No function
export async function sync_to_huawei(jobId: string): 
Promise<{ success: boolean; syncStatus: string }> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, syncStatus: "synced" };
}
export interface record_datatype {
  id: string;
  jobNumber: string;
  siteLocation: string;
  jobType: string;
  completionDate: string;
  completionTime: string;
  teamPhotoUrl: string;
  personnelNames: string[];
  notes: string;
  contractorCompany: string;
  huaweiSyncStatus: "pending" | "synced" | "failed";
  huaweiSyncDate?: string;
  createdAt: string;
}

export interface submission_datatype {
  jobNumber: string;
  jobType: string;
  siteLocation: string;
  completionDate: string;
  completionTime: string;
  contractorCompany: string;
  notes: string;
  photo?: string;
  personnelNames: string[];
}
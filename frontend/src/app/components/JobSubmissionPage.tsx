import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Camera, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { submit_form } from "../utils/api";
import { submission_datatype } from "../types";
import { toast } from "sonner";

export function submission_page() {

  // Get current location and store it in ref
  const location = useLocation();
  const initialKey = useRef(location.key);

  // Reset form and refresh current date & time
  const clean_form = (): submission_datatype => ({
    jobNumber: "", jobType: "", siteLocation: "",
    completionDate: new Date().toISOString().split("T")[0], // YYYY-MM-DDTHH:MM:SS.MMMZ
    completionTime: new Date().toTimeString().slice(0, 8), // cut here ||14:30:00|| GMT+0800
    contractorCompany: "", notes: "", personnelNames: [],
  });


  // Load form contents from session storage
  const [formData, setFormData] = useState<Partial<submission_datatype>>(() => { // 'Partial' used to allow update few data only
    const session_data = sessionStorage.getItem("form");

    if (session_data) { // Load session data
      try {
        return JSON.parse(session_data);
      }
      catch (e: any) {
        toast.error(`Failed to load session data | ${e} `);
      }
    }
    return clean_form(); // Leave blank
  });
  useEffect(() => {
    sessionStorage.setItem("form", JSON.stringify(formData));
  }, [formData]); // Assign a key 'form_data' for 'formData', ease for tracking


  // Load photo from session storage, if none then remove it
  const [photo_url, set_photo_url] = useState<string>(() => {
    return sessionStorage.getItem("photo") || "";
  });
  useEffect(() => {
    try {
      if (photo_url) { sessionStorage.setItem("photo", photo_url); }
      else { sessionStorage.removeItem("photo"); }
    }
    catch (e) {
      console.warn("Could not save photo to sessionStorage", e);
    }
  }, [photo_url]);


  // Load personnel list from session storage (becuz its not form, so do another)
  const [team_member, set_member] = useState(() => {
    return sessionStorage.getItem("personnel") || "";
  });
  useEffect(() => {
    sessionStorage.setItem("personnel", team_member);
  }, [team_member]);

  // After submitted, show success page
  const [submitted, display_success_page] = useState(false);

  // When user click icon at the navigation bar or wanted to submit 
  // new job completion, system will clear session storage
  const clean_session_storage = () => {
    display_success_page(false);
    setFormData(clean_form());
    set_photo_url("");
    set_member("");

    sessionStorage.removeItem("form");
    sessionStorage.removeItem("photo");
    sessionStorage.removeItem("personnel");
  };
  useEffect(() => {
    // Prevents data cleaned during tab refresh
    if (location.key !== initialKey.current) {
      clean_session_storage();
      initialKey.current = location.key;
    }
  }, [location.key]);


  // Compress image to save memory and prevent tab crashes on mobile
  const compress_photo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image(); // Create image object
      const objectUrl = URL.createObjectURL(file); // Create a temporary URL in local
      // like this blob:http://domain/abc-123-xyz
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl); // Free up memory
        
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        // Calculate compressed width & height
        if (width > height) { 
          if (width > MAX_WIDTH) { 
            height *= MAX_WIDTH / width; width = MAX_WIDTH; 
          } }
        else { 
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height; height = MAX_HEIGHT; 
          } }
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
          set_photo_url(compressedDataUrl);
          toast.success("Photo captured successfully");
        }
      };
      
      img.onerror = () => {
        toast.error("Failed to process image");
      };
      
      img.src = objectUrl;
      e.target.value = ""; // Reset input value so the same photo can be taken again if needed
    }
  };

  const add_personnel = () => {
    if (team_member.trim()) {
      setFormData({
        ...formData, 
        personnelNames: [...(formData.personnelNames || []), team_member.trim()],
        // 'formData.personnelNames || []' choose existing array or create empty array
        // '...' spread operator copies the previous value of personnelNames
        // '[...(), member.trim()]' add the new member to the end of the array
      });
      set_member("");
    }
  };

  const remove_personnel = (index: number) => {
    setFormData({
      ...formData,
      personnelNames: formData.personnelNames?.filter((_, i) => i !== index) || [],
      // If not null, then filter, else return empty []
      // .filter(value, index), because no need value so '_'
    });
  };

  // When uploading data to db, button will be disabled
  const [is_submitting, submit_in_process] = useState(false);
  const handle_submission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Cancel native behaviour of the submit button

    if (!formData.jobType) {
      toast.error("Please select a job type");
      return;
    }
    if (!photo_url) {
      toast.error("Please capture a team photo");
      return;
    }
    if (!formData.personnelNames || formData.personnelNames.length === 0) {
      toast.error("Please add at least one team member");
      return;
    }

    submit_in_process(true);
    try {
      const submission: submission_datatype = {
        jobNumber: formData.jobNumber!,
        jobType: formData.jobType,
        siteLocation: formData.siteLocation!,
        completionDate: formData.completionDate!,
        completionTime: formData.completionTime!,
        contractorCompany: formData.contractorCompany!,
        notes: formData.notes || "",
        photo: photo_url,
        personnelNames: formData.personnelNames,
      };

      // api.ts
      const result = await submit_form(submission);
      
      if (result.success) {
        display_success_page(true);
        toast.success("Job completion submitted successfully!");

        sessionStorage.removeItem("form");
        sessionStorage.removeItem("photo");
        sessionStorage.removeItem("personnel");
      }
    } 
    catch (error) {
      toast.error("Failed to submit job completion");
      console.error(error);
    } 
    finally {
      submit_in_process(false);
    }
  };
 
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Display success message
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Job Submitted Successfully!</h2>
        </div>
        <div className="flex gap-4">
          <Button onClick={clean_session_storage}>
            Submit Another Job
          </Button>
          <Button variant="outline" onClick={() => navigate("/records")}>
            Back to Records
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Submit Job Completion</h2>
        <p className="text-gray-600 mt-1">Record completed work with real-time team photo</p>
      </div>

      {/* Form */}
      <form onSubmit={handle_submission} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Enter the basic information about the completed job</CardDescription>
          </CardHeader>

          <CardContent className = "space-y-4">
            <div className = "grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor = "jobNumber">Job Number *</Label> {/* 'htmlFor': when user click label, the input got focus */}
                <Input
                  id = "jobNumber"
                  placeholder = "e.g., JOB-2026-001"
                  value = {formData.jobNumber}
                  onChange = {(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                  // '...formData' others data remain, but the specific field will be updated
                  required
                />
              </div>

              <div>
                <Label htmlFor = "jobType">Job Type *</Label>
                <Select 
                  value = {formData.jobType}
                  onValueChange = {(value) => setFormData({ ...formData, jobType: value })}
                >
                  <SelectTrigger id = "jobType">
                    <SelectValue placeholder = "Select job type" /> {/* Display the selected value */}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value = "Installation">Installation</SelectItem>
                    <SelectItem value = "Maintenance">Maintenance</SelectItem>
                    <SelectItem value = "Repair">Repair</SelectItem>
                    <SelectItem value = "Inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor = "siteLocation">Site Location *</Label>
              <Input
                id = "siteLocation"
                placeholder = "e.g., Tower Site Alpha - Sector 3"
                value = {formData.siteLocation}
                onChange = {(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                required
                
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor = "completionDate">Completion Date *</Label>
                <Input
                  id = "completionDate"
                  type = "date"
                  value = {formData.completionDate}
                  onChange = {(e) => setFormData({ ...formData, completionDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor = "completionTime">Completion Time *</Label>
                <Input
                  id = "completionTime"
                  type = "time"
                  value = {formData.completionTime}
                  onChange = {(e) => setFormData({ ...formData, completionTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor = "contractorCompany">Contractor Company *</Label>
              <Input
                id = "contractorCompany"
                placeholder = "e.g., TechCom Solutions Ltd."
                value = {formData.contractorCompany}
                onChange = {(e) => setFormData({ ...formData, contractorCompany: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor = "notes">Job Notes</Label>
              <Textarea
                id = "notes"
                placeholder = "Enter any additional notes about the job completion..."
                value = {formData.notes}
                onChange = {(e) => setFormData({ ...formData, notes: e.target.value })}
                rows = {3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-Time Team Photo</CardTitle>
            <CardDescription>
              Capture a live photo of the team who performed this job for verification
            </CardDescription>
          </CardHeader>
          <CardContent className = "space-y-4">
            <input
              type = "file"
              accept = "image/*"
              capture = "environment"
              className = "hidden"
              ref = {fileInputRef}
              onChange = {compress_photo}
            />
            {/* If have photo then display it with retake button, else display capture button */}
            {photo_url ? (
              <div className = "space-y-3">
                <img
                  src = {photo_url}
                  alt = "Team photo"
                  className="w-full h-auto object-cover rounded-lg"
                />
                <Button
                  type = "button"
                  variant = "outline"
                  onClick = {() => fileInputRef.current?.click()}
                  className = "w-full"
                >
                  <Camera className = "w-4 h-4 mr-2" />
                  Retake Photo
                </Button>
              </div>
            ) : (
              <button
                type = "button"
                onClick = {() => fileInputRef.current?.click()}
                className = "w-full border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-gray-400 transition-colors hover:bg-gray-50"
              >
                <div className = "flex flex-col items-center gap-3">
                  <div className = "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className = "font-medium text-gray-900">Capture Team Photo</p>
                  <p className = "text-sm text-gray-500">Click to open camera and take a real-time photo</p>
                </div>
              </button>
            )}
            
            <Alert>
              <Camera className = "h-4 w-4" />
              <AlertDescription>
                Real-time camera capture ensures authentic verification that work was completed by your team on-site.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Personnel</CardTitle>
            <CardDescription>Add names of team members who performed this job</CardDescription>
          </CardHeader>
          <CardContent className = "space-y-4">
            <div className = "flex gap-2">
              <Input
                placeholder = "Enter personnel name"
                value = {team_member}
                onChange = {(e) => set_member(e.target.value)}
                // If user press 'enter' then auto add. Also 'enter' wont submit the form
                onKeyDown = {(e) => { if (e.key === "Enter") { e.preventDefault(); add_personnel(); }}}/>
              <Button type = "button" onClick = {add_personnel}>
                Add
              </Button>
            </div>

            {formData.personnelNames && formData.personnelNames.length > 0 ? (
              <div className = "space-y-2">
                {formData.personnelNames.map((name, index) => (
                  <div
                    key = {index}
                    className = "flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className = "text-gray-900">{name}</span>
                    <Button
                      type = "button"
                      variant = "ghost"
                      size = "sm"
                      onClick={() => remove_personnel(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className = "h-4 w-4" />
                <AlertDescription>
                  No personnel added yet. Add at least one team member.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className = "flex gap-3">
          {/* Cancel button */}
          <Button
            type = "button"
            variant = "outline"
            className = "flex-1"
            onClick = {() => navigate("/records")}
          >
            Cancel
          </Button>
          
          {/* Submit button */}
          <Button type = "submit" className = "flex-1" disabled={is_submitting}>
            {is_submitting ? (
              <>
                <Loader2 className = "w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className = "w-4 h-4 mr-2" />
                Submit Job Completion
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
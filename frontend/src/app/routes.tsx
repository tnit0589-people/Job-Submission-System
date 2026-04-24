// Export to App.tsx
import { createBrowserRouter } from "react-router";
import { submission_page } from "./components/JobSubmissionPage";
import { records_page } from "./components/JobRecordsPage";
import { layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: layout,
    children: [
      { index: true, Component: submission_page },
      { path: "records", Component: records_page },
    ],
  },
]);
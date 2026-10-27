import { Navigate, Route, Routes } from "react-router-dom";
import { getUser } from "./api";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewApplication from "./pages/NewApplication";
import UploadDocuments from "./pages/UploadDocuments";
import ValidationResults from "./pages/ValidationResults";
import AdminReview from "./pages/AdminReview";

function Private({ children, role }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Private>
            <Layout />
          </Private>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/applications/new" element={<NewApplication />} />
        <Route path="/applications/:id/upload" element={<UploadDocuments />} />
        <Route path="/applications/:id/results" element={<ValidationResults />} />
        <Route
          path="/admin"
          element={
            <Private role="admin">
              <AdminReview />
            </Private>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

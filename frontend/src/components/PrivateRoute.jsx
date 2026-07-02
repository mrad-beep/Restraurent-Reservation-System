import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap protected pages: optionally restrict by role, e.g. role="admin"
const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
};

export default PrivateRoute;

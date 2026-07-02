import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="brand">Restaurant Reservations</div>
      <div className="links">
        {user ? (
          <>
            <span style={{ marginRight: 16 }}>
              {user.name} ({user.role})
            </span>
            {user.role === "customer" && <Link to="/">My Reservations</Link>}
            {user.role === "admin" && <Link to="/admin">Admin Panel</Link>}
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;

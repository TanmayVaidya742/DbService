import { Navigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import DatabaseDetails from "../components/DatabaseDetails";
import LandingPage from "../components/LandingPage";
import Login from "../components/Login";
import Organizations from "../components/Organizations";
import PricingPlans from "../components/PricingPlans";
import Register from "../components/Register";
import UserDashboard from "../components/UserDashboard";
import AuthGuard from "../guards/AuthGuard";
import Layout from "../components/layout/layout";
import LaunchPagePyramid from "../components/PyramidLaunch/LaunchPagePyramid";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
};
export const routes = [
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "launch-dbaas",
    element: <LaunchPagePyramid />
  },
  {
    path: "",
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      {
        path: "/superadmin-dashboard",
        element: <Dashboard />,
      },
      {
        path: "/databases",
        element: <UserDashboard />,
      },
      {
        path: "/organizations",
        element: <Organizations />,
      },
      {
        path: "/database/:dbName/:dbId",
        element: <DatabaseDetails />,
      },
      {
        path: "/pricing",
        element: <PricingPlans />,
      },
    ],
  },
];

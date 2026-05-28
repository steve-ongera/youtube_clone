import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/main.css";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home       from "./pages/Home";
import Watch      from "./pages/Watch";
import Search     from "./pages/Search";
import Channel    from "./pages/Channel";
import Upload     from "./pages/Upload";
import Login      from "./pages/Login";
import Register   from "./pages/Register";
import NotFound   from "./pages/NotFound";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index          element={<Home />} />
          <Route path="watch/:id"    element={<Watch />} />
          <Route path="search"       element={<Search />} />
          <Route path="channel/:id"  element={<Channel />} />

          {/* Auth-required routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="upload" element={<Upload />} />
          </Route>
        </Route>

        {/* Full-page (no sidebar/nav) */}
        <Route path="login"    element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="*"        element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
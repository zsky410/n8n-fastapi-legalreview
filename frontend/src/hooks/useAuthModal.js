import { createContext, createElement, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFormPanel from "../components/auth/AuthFormPanel.jsx";
import Modal from "../components/ui/Modal.jsx";
import { useAuth } from "./useAuth.js";

const AuthModalContext = createContext(null);

function normalizeTab(value) {
  return value === "register" ? "register" : "login";
}

export function AuthModalProvider({ children }) {
  const navigate = useNavigate();
  const { getRedirectPathForRole, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState("login");

  function closeAuthModal() {
    setIsOpen(false);
  }

  function openAuthModal(nextTab = "login") {
    if (user) {
      navigate(getRedirectPathForRole(user.role));
      return;
    }

    setTab(normalizeTab(nextTab));
    setIsOpen(true);
  }

  const value = {
    closeAuthModal,
    isAuthModalOpen: isOpen,
    openAuthModal,
  };

  return createElement(
    AuthModalContext.Provider,
    { value },
    children,
    createElement(
      Modal,
      {
        open: isOpen,
        onClose: closeAuthModal,
        title: "Khu vực khách hàng",
        description: "Đăng nhập hoặc tạo tài khoản ngay trong popup để tiếp tục mà không rời trang hiện tại.",
        className: "max-w-xl border border-white/60 bg-white/95 shadow-[0_40px_120px_rgba(15,23,42,0.18)] backdrop-blur-xl",
      },
      createElement(AuthFormPanel, {
        initialTab: tab,
        onSuccess: closeAuthModal,
        onTabChange: setTab,
        showHeading: false,
      }),
    ),
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error("useAuthModal phải được dùng bên trong AuthModalProvider.");
  }

  return context;
}

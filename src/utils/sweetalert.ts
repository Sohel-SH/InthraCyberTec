import Swal from "sweetalert2";
import 'sweetalert2/dist/sweetalert2.min.css';

export const showError = (title: string, message: string) => {
  Swal.fire({
    title,
    text: message,
    icon: "error",
    confirmButtonColor: "#4B3ADB",
  });
};

export const showSuccess = (title: string, message: string) => {
  Swal.fire({
    title,
    text: message,
    icon: "success",
    confirmButtonColor: "#4B3ADB",
  });
};

export const showWarning = (title: string, message: string) => {
  Swal.fire({
    title,
    text: message,
    icon: "warning",
    confirmButtonColor: "#4B3ADB",
  });
};

export const showInfo = (title: string, message: string) => {
  Swal.fire({
    title,
    text: message,
    icon: "info",
    confirmButtonColor: "#4B3ADB",
  });
};

export const showConfirm = async (title: string, text: string, confirmButtonText = "Yes", cancelButtonText = "No") => {
  const result = await Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4B3ADB",
    cancelButtonColor: "#6c757d",
    confirmButtonText,
    cancelButtonText,
  });
  return result.isConfirmed;
};

export const showSessionExpiredConfirm = async () => {
  const result = await Swal.fire({
    title: "Session Expired",
    text: "Your session has expired. Would you like to log in again to stay on this page and preserve your work?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#4B3ADB",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Log In Again",
    cancelButtonText: "Go to Sign In",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
  return result.isConfirmed;
};

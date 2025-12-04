// --- Khai báo các đối tượng màn hình ---
const loginScreen = document.getElementById("loginScreen");
const forgotPasswordScreen = document.getElementById("forgotPasswordScreen");
const privacyScreen = document.getElementById("privacyScreen");
const screens = [loginScreen, forgotPasswordScreen, privacyScreen];

// --- Khai báo các nút điều hướng và input ---
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const loginLink = document.getElementById("loginLink");
const backButton = document.getElementById("backButton");
const privacyLink = document.getElementById("privacyLink");
const loginSubmitButton = document.getElementById("loginSubmitButton");

// Input màn hình Đăng nhập
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");

const hotlineLink = document.getElementById("hotlineLink");

// Input màn hình Quên mật khẩu
const forgotUsernameInput = document.getElementById("forgotUsernameInput");
const forgotEmailInput = document.getElementById("forgotEmailInput");
const sendRequestButton = document.getElementById("sendRequestButton");

// --- Khai báo các đối tượng Modal ---
const errorModal = document.getElementById("errorModal");
const closeErrorModalButton = document.getElementById("closeErrorModalButton");
const errorMessage = document.getElementById("errorMessage");

const hotlineModal = document.getElementById("hotlineModal");
const hotlineLaterButton = document.getElementById("hotlineLaterButton");
const hotlineCallButton = document.getElementById("hotlineCallButton");

const successModal = document.getElementById("successModal");
const closeSuccessModalButton = document.getElementById(
  "closeSuccessModalButton"
);

// --- Biến lưu trạng thái màn hình ---
let currentScreen = "loginScreen";
// ĐƯỜNG DẪN CHUNG CHO CẢ TÀI KHOẢN KHÁCH VÀ ĐĂNG NHẬP 1/123
const CRIME_PREVENTION_PAGE = "index.html";
const TRANG_ADMIN = "admin.html";

// --- HELPER: HIỂN THỊ THÔNG BÁO POPUP ---
function showNotification(message, type = "success") {
  const div = document.createElement("div");
  div.className = `notification-popup ${type}`;

  const icon =
    type === "success"
      ? '<i class="ph ph-check-circle"></i>'
      : '<i class="ph ph-warning-circle"></i>';

  div.innerHTML = `${icon} <span>${message}</span>`;
  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 3000);
}

// --- Hàm chuyển đổi màn hình ---
function switchScreen(targetScreenId) {
  screens.forEach((screen) => {
    if (screen.id === targetScreenId) {
      screen.classList.add("active");
      currentScreen = targetScreenId;
    } else {
      screen.classList.remove("active");
    }
  });
  updateNavIcons();
}

// --- Cập nhật icon điều hướng ---
function updateNavIcons() {
  if (currentScreen !== "loginScreen") {
    backButton.style.display = "block";
  } else {
    backButton.style.display = "none";
  }
}

// --- Gán sự kiện cho các nút điều hướng nội bộ ---
forgotPasswordLink.addEventListener("click", (e) => {
  e.preventDefault();
  switchScreen("forgotPasswordScreen");
});

loginLink.addEventListener("click", (e) => {
  e.preventDefault();
  switchScreen("loginScreen");
});

privacyLink.addEventListener("click", (e) => {
  e.preventDefault();
  switchScreen("privacyScreen");
});

backButton.addEventListener("click", (e) => {
  e.preventDefault();
  switchScreen("loginScreen");
});

// --- Sự kiện cho nút Đăng nhập chính (Logic 1/123) ---
loginSubmitButton.addEventListener("click", (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // LOGIC MỚI: TÀI KHOẢN ĐẶT SẴN (Username: 1, Password: 123)
  if (
    (username === "1" && password === "123") ||
    (username === "user" && password === "user")
  ) {
    // CHUYỂN TRANG NGAY LẬP TỨC
    window.location.href = CRIME_PREVENTION_PAGE;
    return;
  }
  if (username === "admin" && password === "admin") {
    // CHUYỂN TRANG NGAY LẬP TỨC
    window.location.href = TRANG_ADMIN;
    return;
  }

  // Kiểm tra trường trống
  if (username === "" || password === "") {
    errorMessage.textContent =
      "Tên đăng nhập hoặc Email và mật khẩu không được để trống";
    errorModal.style.display = "flex";
  } else {
    showNotification("Đăng nhập thất bại. Vui lòng kiểm tra lại!", "error");
  }
});

closeErrorModalButton.addEventListener("click", () => {
  errorModal.style.display = "none";
});

// --- XỬ LÝ SỰ KIỆN GỬI YÊU CẦU QUÊN MẬT KHẨU ---
sendRequestButton.addEventListener("click", (e) => {
  e.preventDefault();
  const username = forgotUsernameInput.value.trim();
  const email = forgotEmailInput.value.trim();

  if (username === "" || email === "") {
    errorMessage.textContent =
      "Vui lòng nhập Tên đăng nhập và Email để khôi phục mật khẩu.";
    errorModal.style.display = "flex";
  } else {
    // Hiển thị Modal Thành công
    successModal.style.display = "flex";

    // Xóa nội dung input sau khi gửi thành công
    forgotUsernameInput.value = "";
    forgotEmailInput.value = "";
  }
});

closeSuccessModalButton.addEventListener("click", () => {
  successModal.style.display = "none";
  switchScreen("loginScreen");
});

// --- XỬ LÝ SỰ KIỆN CHO HOTLINE HỖ TRỢ ---
hotlineLink.addEventListener("click", (e) => {
  e.preventDefault();
  hotlineModal.style.display = "flex";
});

hotlineLaterButton.addEventListener("click", () => {
  hotlineModal.style.display = "none";
});

hotlineCallButton.addEventListener("click", () => {
  showNotification("Đang gọi đến tổng đài 1900.XXXX...", "success");
  hotlineModal.style.display = "none";
});

// Khởi tạo trạng thái ban đầu
updateNavIcons();

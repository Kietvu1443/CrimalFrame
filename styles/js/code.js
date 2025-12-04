// 1. XỬ LÝ CHỨC NĂNG ẨN DANH
const anonymousCheckbox = document.getElementById("isAnonymous");
const personalInfoSection = document.getElementById("personalInfoSection");
const personalInputs = personalInfoSection.querySelectorAll("input"); // Lấy tất cả ô input trong vùng cá nhân

anonymousCheckbox.addEventListener("change", function () {
  if (this.checked) {
    // Nếu tick chọn: Thêm class làm mờ + disable các ô input
    personalInfoSection.classList.add("disabled-section");
    personalInputs.forEach((input) => (input.disabled = true));
  } else {
    // Nếu bỏ tick: Bỏ class làm mờ + enable lại input
    personalInfoSection.classList.remove("disabled-section");
    personalInputs.forEach((input) => (input.disabled = false));
  }
});

// 2. XỬ LÝ HIỂN THỊ TÊN FILE KHI UPLOAD
const fileInput = document.getElementById("fileInput");
const fileLabel = document.getElementById("fileLabel");

const fileInput2 = document.getElementById("fileInput2");
const fileLabel2 = document.getElementById("fileLabel2");

if (fileInput) {
  fileInput.addEventListener("change", function () {
    if (this.files && this.files.length > 0) {
      fileLabel.textContent = `Đã chọn ${this.files.length} tệp`;
      fileLabel.style.color = "#3b82f6"; // Đổi màu chữ thành xanh
      fileLabel.style.fontWeight = "bold";
    } else {
      fileLabel.textContent = "Nhấn để chọn tệp";
      fileLabel.style.color = "#64748b";
    }
  });
}

if (fileInput2) {
  fileInput2.addEventListener("change", function () {
    if (this.files && this.files.length > 0) {
      fileLabel2.textContent = `Đã chọn ${this.files.length} tệp`;
      fileLabel2.style.color = "#3b82f6"; // Đổi màu chữ thành xanh
      fileLabel2.style.fontWeight = "bold";
    } else {
      fileLabel2.textContent = "Nhấn để chọn tệp";
      fileLabel2.style.color = "#64748b";
    }
  });
}

// 3. XỬ LÝ GỬI FORM (SUBMIT)
const form = document.getElementById("crimeForm");

// Hàm hỗ trợ chuyển file sang Base64
const convertBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = (error) => {
      reject(error);
    };
  });
};

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // Ngăn trang web load lại (mặc định của form)

    // Lấy dữ liệu từ form
    const criminalNameEl = document.getElementById("criminalName");
    const identityEl = document.getElementById("idenity");

    const criminalNameInput = criminalNameEl ? criminalNameEl.value : "";
    const identityInput = identityEl ? identityEl.value : "";

    const data = {
      loai: document.getElementById("incidentType").value,
      ngay: document.getElementById("date").value,
      diaChi: document.getElementById("address").value,
      anDanh: anonymousCheckbox.checked,
      // Nếu ẩn danh thì để trống thông tin cá nhân
      hoTen: anonymousCheckbox.checked
        ? "Ẩn danh"
        : document.getElementById("fullname").value,
      moTa: document.getElementById("description").value,
      criminalName: criminalNameInput,
      identity: identityInput,
    };

    // Xử lý ảnh chân dung (Base64) - ID: fileInput
    let imageBase64 = "./styles/images/wanted_placeholder.png";
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      try {
        imageBase64 = await convertBase64(fileInput.files[0]);
      } catch (error) {
        console.error("Lỗi chuyển đổi ảnh chân dung:", error);
      }
    }

    // Xử lý ảnh bằng chứng (Base64 Array) - ID: fileInput2
    let evidenceImages = [];
    if (fileInput2 && fileInput2.files && fileInput2.files.length > 0) {
      for (let i = 0; i < fileInput2.files.length; i++) {
        if (fileInput2.files[i].type.startsWith("image/")) {
          try {
            const base64 = await convertBase64(fileInput2.files[i]);
            evidenceImages.push(base64);
          } catch (error) {
            console.error("Lỗi chuyển đổi ảnh bằng chứng:", error);
          }
        }
      }
    }

    // LƯU VÀO INDEXED DB (Thay thế LocalStorage)
    let finalName = data.anDanh
      ? "Đối tượng (Chưa rõ danh tính)"
      : "Đối tượng bị tố giác";
    if (data.criminalName && data.criminalName.trim() !== "") {
      finalName = data.criminalName;
    }

    const newReport = {
      id: Date.now(), // ID ngẫu nhiên theo thời gian
      name: finalName,
      dob: "Chưa rõ",
      hometown: "Chưa rõ",
      address: data.diaChi,
      crime:
        data.loai === "Trộm cắp"
          ? "Trộm cắp tài sản"
          : data.loai === "Lừa đảo"
          ? "Lừa đảo chiếm đoạt tài sản"
          : data.loai === "Cố ý gây thương tích"
          ? "Cố ý gây thương tích"
          : data.loai === "Giết người"
          ? "Giết người"
          : data.loai === "Tổ chức đánh bạc"
          ? "Tổ chức đánh bạc"
          : data.loai === "Tội cướp giật tài sản"
          ? "Tội cướp giật tài sản"
          : data.loai === "Buôn bán hàng cấm"
          ? "Buôn bán hàng cấm"
          : "Tội phạm khác",
      description: data.moTa,
      identity: data.identity,
      image: imageBase64, // Ảnh đại diện (Portrait)
      evidence: evidenceImages, // Ảnh bằng chứng (Evidence)
      status: "pending", // Trạng thái chờ duyệt
      source: "citizen",
      reporterName: data.hoTen, // Lưu tên người báo để Admin biết
      timestamp: Date.now(),
    };

    // --- HELPER: HIỂN THỊ THÔNG BÁO POPUP ---
    function showNotification(message, type = "success") {
      const div = document.createElement("div");
      div.className = `notification-popup ${type}`;

      // Icon dựa trên loại thông báo
      const icon =
        type === "success"
          ? '<i class="ph ph-check-circle"></i>'
          : '<i class="ph ph-warning-circle"></i>';

      div.innerHTML = `${icon} <span>${message}</span>`;
      document.body.appendChild(div);

      // Tự động xóa sau 3 giây (khớp với animation fadeOut)
      setTimeout(() => {
        div.remove();
      }, 3000);
    }

    try {
      await db.addReport(newReport);

      // Hiển thị thông báo
      if (data.anDanh) {
        showNotification(
          "Đã gửi báo cáo ẨN DANH thành công! Thông tin đang chờ Admin duyệt."
        );
      } else {
        showNotification(
          `Cảm ơn công dân ${data.hoTen} đã gửi báo cáo! Thông tin đang chờ Admin duyệt.`
        );
      }
    } catch (error) {
      console.error("Lỗi khi lưu vào DB:", error);
      showNotification(
        "Có lỗi xảy ra khi lưu báo cáo. Vui lòng thử lại!",
        "error"
      );
      return;
    }

    console.log("Dữ liệu gửi lên server:", data);

    // Reset form sau khi gửi thành công
    form.reset();
    if (fileLabel) {
      fileLabel.textContent = "Nhấn để chọn tệp";
      fileLabel.style.color = "#64748b";
    }
    if (fileLabel2) {
      fileLabel2.textContent = "Nhấn để chọn tệp";
      fileLabel2.style.color = "#64748b";
    }
  });
}

// 4. CHỨC NĂNG RESET FORM (Nút Xóa)
function resetForm() {
  if (confirm("Bạn có chắc muốn xóa hết thông tin vừa nhập không?")) {
    if (form) form.reset();
    // Reset thủ công trạng thái ẩn danh về mặc định
    personalInfoSection.classList.remove("disabled-section");
    personalInputs.forEach((input) => (input.disabled = false));
    if (fileLabel) {
      fileLabel.textContent = "Nhấn để chọn tệp";
      fileLabel.style.color = "#64748b";
    }
    if (fileLabel2) {
      fileLabel2.textContent = "Nhấn để chọn tệp";
      fileLabel2.style.color = "#64748b";
    }
  }
}

// 5. PRE-FILL LOGIC (Từ trang truy nã)
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const suspectName = params.get("suspect");
  if (suspectName) {
    const descInput = document.getElementById("description");
    const criminalNameInput = document.getElementById("criminalName");

    if (criminalNameInput) {
      criminalNameInput.value = suspectName;
    }

    if (descInput) {
      descInput.value = `Tôi muốn tố giác đối tượng truy nã: ${suspectName}.\n\nChi tiết sự việc: `;
      descInput.focus();
    }
  }
});

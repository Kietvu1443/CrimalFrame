// --- JavaScript cho Tabs và Hiển thị/Ẩn Câu hỏi ---

// 1. Chức năng chuyển đổi Tab
document.querySelectorAll(".tab-item").forEach((tab) => {
  tab.addEventListener("click", function () {
    // Xóa trạng thái active khỏi tất cả các tab và tab pane
    document
      .querySelectorAll(".tab-item")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".faq-tab-pane")
      .forEach((p) => p.classList.remove("active"));

    // Thêm trạng thái active cho tab được click
    this.classList.add("active");

    // Hiển thị tab pane tương ứng
    const tabId = this.getAttribute("data-tab");
    document.getElementById(tabId).classList.add("active");
  });
});

// 2. Chức năng Hiển thị/Ẩn Câu trả lời (Accordion)
function toggleAnswer(faqItem) {
  const answer = faqItem.querySelector(".faq-answer");

  // Kiểm tra xem câu hỏi hiện tại có đang mở không
  const isExpanded = faqItem.classList.contains("expanded");

  // Đóng tất cả các câu hỏi khác
  document.querySelectorAll(".faq-item.expanded").forEach((item) => {
    if (item !== faqItem) {
      item.classList.remove("expanded");
      item.querySelector(".faq-answer").style.maxHeight = 0;
    }
  });

  // Mở/Đóng câu hỏi hiện tại
  if (isExpanded) {
    faqItem.classList.remove("expanded");
    answer.style.maxHeight = 0;
  } else {
    faqItem.classList.add("expanded");
    // Đặt max-height lớn hơn nội dung để tạo hiệu ứng trượt
    answer.style.maxHeight = answer.scrollHeight + "px";
  }
}

// Đảm bảo tab 'web' được active khi load
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector('.tab-item[data-tab="web"]').classList.add("active");
  document.getElementById("web").classList.add("active");

  // Loại bỏ active từ các tab khác nếu có
  document.querySelectorAll(".tab-item").forEach((t) => {
    if (t.getAttribute("data-tab") !== "web") {
      t.classList.remove("active");
    }
  });
  document.querySelectorAll(".faq-tab-pane").forEach((p) => {
    if (p.id !== "web") {
      p.classList.remove("active");
    }
  });
});

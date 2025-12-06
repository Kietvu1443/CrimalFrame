let currentFilter = "pending";

document.addEventListener("DOMContentLoaded", () => {
  loadReports();
  loadDashboardStats();
});

function filterStatus(status) {
  currentFilter = status;

  // Cập nhật giao diện Tabs
  document.querySelectorAll(".tabs button").forEach((btn) => {
    btn.style.background = "white";
    btn.style.border = "1px solid #e2e8f0";
  });
  document.getElementById(`tab-${status}`).style.background = "#e2e8f0";
  document.getElementById(`tab-${status}`).style.border = "none";

  loadReports();
}

async function loadReports() {
  const tbody = document.getElementById("report-list");
  tbody.innerHTML =
    '<tr><td colspan="7" style="text-align:center;">Đang tải...</td></tr>';

  try {
    const reports = await db.getReportsByStatus(currentFilter);

    // Sắp xếp mới nhất lên đầu
    reports.sort((a, b) => b.timestamp - a.timestamp);

    tbody.innerHTML = "";

    if (reports.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="empty-state">Không có dữ liệu</td></tr>';
      return;
    }

    reports.forEach((r) => {
      const tr = document.createElement("tr");
      const date = new Date(r.timestamp).toLocaleString("vi-VN");

      let statusClass = "status-pending";
      let statusText = "Đang xem xét";
      if (r.status === "approved") {
        statusClass = "status-approved";
        statusText = "Đã thông qua";
      }
      if (r.status === "rejected") {
        statusClass = "status-rejected";
        statusText = "Đã từ chối";
      }

      let actions = `<button class="action-btn btn-view" onclick="viewDetail(${r.id})"><i class="ph ph-eye"></i> Xem</button>`;

      if (r.status === "pending") {
        actions += `
                    <button class="action-btn btn-approve" onclick="updateStatus(${r.id}, 'approved')"><i class="ph ph-check"></i> Duyệt</button>
                    <button class="action-btn btn-reject" onclick="updateStatus(${r.id}, 'rejected')"><i class="ph ph-x"></i> Từ chối</button>
                `;
      } else if (r.status === "approved") {
        actions += `<button class="action-btn btn-reject" onclick="updateStatus(${r.id}, 'rejected')"><i class="ph ph-x"></i> Gỡ bỏ</button>`;
      }

      tr.innerHTML = `
                <td>#${r.id.toString().slice(-4)}</td>
                <td>${r.reporterName || "Ẩn danh"}</td>
                <td>${r.name}</td>
                <td>${r.crime}</td>
                <td>${date}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${actions}</td>
            `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading reports:", error);
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center; color:red;">Lỗi tải dữ liệu</td></tr>';
  }
}

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

async function updateStatus(id, status) {
  if (!confirm(`Bạn có chắc muốn chuyển trạng thái thành "${status}"?`)) return;

  try {
    await db.updateReportStatus(id, status);
    loadReports(); // Reload list
    closeModal();
    showNotification(`Đã cập nhật trạng thái thành công!`, "success");
  } catch (error) {
    showNotification("Lỗi cập nhật trạng thái: " + error, "error");
  }
}

async function viewDetail(id) {
  try {
    // Vì getReportsByStatus trả về mảng, ta tìm phần tử cần thiết trong mảng đó.
    // Cách giải quyết: lấy theo trạng thái hiện tại và tìm kiếm.
    const reports = await db.getReportsByStatus(currentFilter);
    const report = reports.find((r) => r.id === id);

    if (!report) return;

    document.getElementById(
      "modal-title"
    ).textContent = `Chi tiết báo cáo #${id}`;
    document.getElementById("modal-img").src =
      report.image || "./styles/images/wanted_placeholder.png";
    document.getElementById("modal-reporter").textContent =
      report.reporterName || "Ẩn danh";
    document.getElementById("modal-suspect").textContent = report.name;
    document.getElementById("modal-address").textContent = report.address;
    document.getElementById("modal-crime").textContent = report.crime;
    document.getElementById("modal-desc").textContent = report.description;

    // Bằng chứng (Evidence)
    const evidenceDiv = document.getElementById("modal-evidence");
    evidenceDiv.innerHTML = "";
    if (report.evidence && report.evidence.length > 0) {
      report.evidence.forEach((src) => {
        const img = document.createElement("img");
        img.src = src;
        img.style.width = "60px";
        img.style.height = "60px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "4px";
        img.style.cursor = "pointer";
        img.onclick = () => window.open(src, "_blank");
        evidenceDiv.appendChild(img);
      });
    }

    // Hành động (Actions)
    const actionsDiv = document.getElementById("modal-actions");
    if (report.status === "pending") {
      actionsDiv.innerHTML = `
                <button class="action-btn btn-approve" onclick="updateStatus(${report.id}, 'approved')">Duyệt tin này</button>
                <button class="action-btn btn-reject" onclick="updateStatus(${report.id}, 'rejected')">Từ chối</button>
            `;
    } else {
      actionsDiv.innerHTML = "";
    }

    document.getElementById("detailModal").style.display = "block";
  } catch (error) {
    console.error(error);
  }
}

function closeModal() {
  document.getElementById("detailModal").style.display = "none";
}

// Đóng modal khi click ra ngoài
window.onclick = function (event) {
  const modal = document.getElementById("detailModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

async function loadDashboardStats() {
  try {
    // Fetch reports from IndexedDB
    const reports = await db.getAllReports();

    // Calculate stats
    const totalReports = reports.length;
    const processingCount = reports.filter(
      (r) => r.status === "pending"
    ).length;
    const processedCount = reports.filter(
      (r) => r.status === "approved"
    ).length;

    // Update UI
    document.getElementById("total-criminals").textContent = totalReports;
    document.getElementById("total-revenue").textContent = processingCount;
    document.getElementById("total-debt").textContent = processedCount;

    // Render Chart
    renderFinanceChart(processingCount, processedCount);
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
}

function renderFinanceChart(processing, processed) {
  const ctx = document.getElementById("financeChart").getContext("2d");

  // Destroy existing chart if any (though here we just load once)
  if (window.myFinanceChart) {
    window.myFinanceChart.destroy();
  }

  window.myFinanceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Tất cả thời gian"],
      datasets: [
        {
          label: "Tổng tội phạm (Đang xử lí)",
          data: [processing],
          backgroundColor: "#22c55e",
          barThickness: 50,
          borderRadius: 4,
        },
        {
          label: "Tổng tội phạm (Đã xử lí)",
          data: [processed],
          backgroundColor: "#ef4444",
          barThickness: 50,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "#f1f5f9",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: "#1e293b",
          padding: 12,
          cornerRadius: 8,
        },
      },
    },
  });
}

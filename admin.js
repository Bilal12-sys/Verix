
import {
    db,
    collection,
    query,
    where,
    limit,
    getDocs,
    addDoc,
    serverTimestamp  // Added this import
} from "./config/firebase.js";

// ==========================
// Desktop Sidebar
// ==========================
const aside = document.querySelector("aside");
const sidebarToggle = document.getElementById("sidebarToggle");
const menuBtn = document.querySelector(".mobile_menu");

if (sidebarToggle && aside) {
    sidebarToggle.addEventListener("click", () => {
        aside.classList.add("open");
        aside.classList.remove("close");
    });

    menuBtn.addEventListener("click", () => {
        if (window.innerWidth <= 1000) {
            aside.classList.remove("open");
        } else {
            aside.classList.toggle("close");
        }
    });
}

// ==========================
// Mobile sidebar
// ==========================
if (menuBtn && aside) {
    menuBtn.addEventListener("click", () => {
        aside.classList.add("open");
        aside.classList.remove("close");
    });

    sidebarToggle.addEventListener("click", () => {
        if (window.innerWidth <= 700) {
            aside.classList.remove("open");
        } else {
            aside.classList.toggle("close");
        }
    });
}

// ==========================
// Background Animation
// ==========================
const glow = document.querySelector(".grid-glow");

if (glow) {
    document.addEventListener("mousemove", (e) => {
        glow.style.opacity = "1";
        glow.style.setProperty("--mx", `${e.clientX}px`);
        glow.style.setProperty("--my", `${e.clientY}px`);
    });

    document.addEventListener("mouseleave", () => {
        glow.style.opacity = "0";
    });
}

// ==========================
// Sidebar Active Item + Tooltips
// ==========================
const menuItems = document.querySelectorAll(".items > span");

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
    });

    item.addEventListener("mouseenter", () => {
        if (aside && aside.classList.contains("collapsed")) {
            const text = item.querySelector("p");
            item.title = text ? text.textContent : "";
        }
    });
});

// ==========================
// Back Button
// ==========================
const backBtn = document.getElementById("Back_btn");

if (backBtn) {
    backBtn.addEventListener("click", () => {
        window.location.href = "Dashboard.html";
    });
}

// ==========================
// Asset Detail Elements
// ==========================
const Asset_main_image = document.getElementById("Asset_main_image");
const Asset_name = document.getElementById("Asset_name");
const Asset_Id = document.getElementById("Asset_Id");
const Asset_caterogery = document.getElementById("Asset_caterogery");
const Asset_serial = document.getElementById("Asset_serial");
const Asset_location = document.getElementById("Asset_location");
const Asset_installed = document.getElementById("Asset_installed");
const Asset_Department = document.getElementById("Asset_Department");
const Asset_warranty = document.getElementById("Asset_warranty");
const Asset_model = document.getElementById("Asset_model");
const Asset_status = document.getElementById("Asset_status");
const Asset_decription = document.getElementById("Asset_decription");

function showPublicError(message) {
    const pop = document.createElement("div");
    const popup = document.createElement("div");
    const inside_text = document.createElement("h3");

    pop.classList.add("box_p");
    popup.classList.add("pop_box", "pop_error");
    inside_text.classList.add("box_text");
    inside_text.textContent = message;

    popup.appendChild(inside_text);
    pop.appendChild(popup);
    document.body.appendChild(pop);

    setTimeout(() => {
        pop.classList.add("pop_out");
        setTimeout(() => pop.remove(), 300);
    }, 3000);
}

// ==========================
// Generic info / status popup (used for Report cancel/submit)
// ==========================
function showInfoPopup(message, type = "info") {
    const pop = document.createElement("div");
    const popup = document.createElement("div");
    const inside_text = document.createElement("h3");

    pop.classList.add("box_p");
    popup.classList.add("pop_box", type === "error" ? "pop_error" : "pop_info");
    inside_text.classList.add("box_text");
    inside_text.textContent = message;

    popup.appendChild(inside_text);
    pop.appendChild(popup);
    document.body.appendChild(pop);

    setTimeout(() => {
        pop.classList.add("pop_out");
        setTimeout(() => pop.remove(), 300);
    }, 3000);
}

function populatePublicAsset(asset) {
    if (Asset_main_image) Asset_main_image.src = asset.image || "No image provided";
    if (Asset_name) Asset_name.textContent = asset.name || "Unknown Asset";
    if (Asset_Id) Asset_Id.textContent = asset.assetId || "N/A";
    if (Asset_caterogery) Asset_caterogery.textContent = asset.category || "N/A";
    if (Asset_serial) Asset_serial.textContent = asset.assetId || "N/A";
    if (Asset_location) Asset_location.textContent = asset.location || "N/A";
    if (Asset_installed) Asset_installed.textContent = asset.installedOn || "N/A";
    if (Asset_Department) Asset_Department.textContent = asset.department || "N/A";
    if (Asset_warranty) Asset_warranty.textContent = asset.warranty || "N/A";
    if (Asset_model) Asset_model.textContent = asset.model || "N/A";
    if (Asset_status) {
        Asset_status.innerHTML = `${asset.status || "Unknown"}`;
    }
    if (Asset_decription) {
        Asset_decription.textContent = asset.description || "No description available.";
    }
}

async function loadPublicAsset() {
    const urlParams = new URLSearchParams(window.location.search);
    const assetId = urlParams.get("id");

    if (!assetId) {
        showPublicError("Asset information is missing from the public link.");
        return;
    }

    try {
        const assetsQuery = query(
            collection(db, "assets"),
            where("assetId", "==", assetId),
            limit(1)
        );
        const querySnapshot = await getDocs(assetsQuery);

        if (querySnapshot.empty) {
            showPublicError("Asset not found. The public link may be invalid or the asset has been removed.");
            return;
        }

        const docSnap = querySnapshot.docs[0];
        const asset = docSnap.data();
        populatePublicAsset(asset);
    } catch (error) {
        console.error("Failed to load asset from Firestore:", error);
        showPublicError("Unable to load asset details at this time. Please try again later.");
    }
}

loadPublicAsset();

// ==========================
// Upload Image to Cloudinary
// ==========================
async function img_upload(file) {
    if (!file) return "";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Verix_Asset_images");

    try {
        const response = await fetch(
            "https://api.cloudinary.com/v1_1/dai3lqoez/image/upload",
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error("Upload failed");
        }

        const data = await response.json();
        return data.secure_url;  // Return the Cloudinary URL

    } catch (error) {
        console.error("Image upload error:", error);
        showInfoPopup("Image upload failed. Submitting without image.", "error");
        return "";  // Return empty string if upload fails
    }
}

// ==========================
// Report btn and form
// (built entirely with document.createElement — no innerHTML)
// ==========================
function Report() {

    // ---------- Overlay ----------
    const overlay = document.createElement("div");
    overlay.className = "report_overlay";

    // ---------- Popup ----------
    const popup = document.createElement("div");
    popup.className = "report_popup";

    // ---------- Header ----------
    const report_header = document.createElement("div");
    report_header.className = "report_header";

    const header_text_wrap = document.createElement("div");

    const header_title = document.createElement("h2");
    header_title.textContent = "Report Asset Issue";

    const header_subtitle = document.createElement("p");
    header_subtitle.textContent = "Help us by providing accurate information.";

    header_text_wrap.appendChild(header_title);
    header_text_wrap.appendChild(header_subtitle);

    const report_close = document.createElement("button");
    report_close.className = "report_close";
    report_close.innerHTML = "&times;";
    report_close.type = "button";

    report_header.appendChild(header_text_wrap);
    report_header.appendChild(report_close);

    // ---------- Body ----------
    const report_body = document.createElement("div");
    report_body.className = "report_body";

    const report_grid = document.createElement("div");
    report_grid.className = "report_grid";

    // ---- helper to build a labeled group with an error slot ----
    function createGroup(labelText, fieldEl, extraClass = "") {
        const group = document.createElement("div");
        group.className = "report_group" + (extraClass ? " " + extraClass : "");

        const label = document.createElement("label");
        label.textContent = labelText;

        const error = document.createElement("span");
        error.className = "field_error";
        error.style.display = "none";

        group.appendChild(label);
        group.appendChild(fieldEl);
        group.appendChild(error);

        return { group, error };
    }

    // ---- Full Name ----
    const report_name = document.createElement("input");
    report_name.type = "text";
    report_name.id = "report_name";
    report_name.placeholder = "Enter your full name";
    const nameField = createGroup("Full Name", report_name);

    // ---- Email (optional) ----
    const report_email = document.createElement("input");
    report_email.type = "email";
    report_email.id = "report_email";
    report_email.placeholder = "example@email.com";
    const emailField = createGroup("Email (Optional)", report_email);

    // ---- Issue Type ----
    const report_type = document.createElement("select");
    report_type.id = "report_type";

    const issueOptions = [
        "Select Issue",
        "Not Working",
        "Damaged",
        "Maintenance Required",
        "Missing",
        "Broken Part",
        "Other"
    ];

    issueOptions.forEach((text, idx) => {
        const opt = document.createElement("option");
        opt.textContent = text;
        opt.value = idx === 0 ? "" : text;
        report_type.appendChild(opt);
    });
    const typeField = createGroup("Issue Type", report_type);

    // ---- Priority ----
    const priority_box = document.createElement("div");
    priority_box.className = "priority_box";

    const priorities = [
        { value: "Low", checked: false },
        { value: "Medium", checked: true },
        { value: "High", checked: false }
    ];

    priorities.forEach(p => {
        const label = document.createElement("label");

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "priority";
        radio.value = p.value;
        if (p.checked) radio.checked = true;

        label.appendChild(radio);
        label.appendChild(document.createTextNode(" " + p.value));

        priority_box.appendChild(label);
    });

    const priorityField = createGroup("Priority", priority_box);

    // ---- Description ----
    const report_description = document.createElement("textarea");
    report_description.id = "report_description";
    report_description.rows = 6;
    report_description.placeholder = "Explain what happened with this asset...";
    const descField = createGroup("Describe the Issue", report_description, "full");

    // ---- Image Upload ----
    const upload_group = document.createElement("div");
    upload_group.className = "report_group full";

    const upload_label = document.createElement("label");
    upload_label.textContent = "Attach Image (Optional)";

    const uploadBox = document.createElement("div");
    uploadBox.className = "upload_box";
    uploadBox.id = "uploadBox";

    const issueImage = document.createElement("input");
    issueImage.type = "file";
    issueImage.id = "issueImage";
    issueImage.accept = "image/*";
    issueImage.hidden = true;

    const upload_content = document.createElement("div");
    upload_content.className = "upload_content";

    const uploadSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    uploadSvg.setAttribute("width", "56");
    uploadSvg.setAttribute("height", "56");
    uploadSvg.setAttribute("viewBox", "0 0 24 24");
    uploadSvg.setAttribute("fill", "none");
    uploadSvg.setAttribute("stroke", "currentColor");
    uploadSvg.setAttribute("stroke-width", "2");

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path1.setAttribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");

    const polyline1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline1.setAttribute("points", "17 8 12 3 7 8");

    const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line1.setAttribute("x1", "12");
    line1.setAttribute("y1", "3");
    line1.setAttribute("x2", "12");
    line1.setAttribute("y2", "15");

    uploadSvg.appendChild(path1);
    uploadSvg.appendChild(polyline1);
    uploadSvg.appendChild(line1);

    const upload_title = document.createElement("h3");
    upload_title.textContent = "Upload Asset Image";

    const upload_desc = document.createElement("p");
    upload_desc.textContent = "Click anywhere to select an image";

    const upload_span = document.createElement("span");
    upload_span.textContent = "PNG • JPG • JPEG";

    upload_content.appendChild(uploadSvg);
    upload_content.appendChild(upload_title);
    upload_content.appendChild(upload_desc);
    upload_content.appendChild(upload_span);

    const previewImage = document.createElement("img");
    previewImage.id = "previewImage";
    previewImage.style.display = "none";

    uploadBox.appendChild(issueImage);
    uploadBox.appendChild(upload_content);
    uploadBox.appendChild(previewImage);

    upload_group.appendChild(upload_label);
    upload_group.appendChild(uploadBox);

    // ---- Assemble grid + body ----
    report_grid.appendChild(nameField.group);
    report_grid.appendChild(emailField.group);
    report_grid.appendChild(typeField.group);
    report_grid.appendChild(priorityField.group);

    report_body.appendChild(report_grid);
    report_body.appendChild(descField.group);
    report_body.appendChild(upload_group);

    // ---------- Footer ----------
    const report_footer = document.createElement("div");
    report_footer.className = "report_footer";

    const cancel_report = document.createElement("button");
    cancel_report.className = "cancel_report";
    cancel_report.type = "button";
    cancel_report.textContent = "Cancel";

    const submit_report = document.createElement("button");
    submit_report.className = "submit_report";
    submit_report.type = "button";
    submit_report.textContent = "Submit Report";

    report_footer.appendChild(cancel_report);
    report_footer.appendChild(submit_report);

    // ---------- Assemble popup ----------
    popup.appendChild(report_header);
    popup.appendChild(report_body);
    popup.appendChild(report_footer);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // ==========================
    // Upload Image Preview
    // ==========================
    uploadBox.addEventListener("click", () => {
        issueImage.click();
    });

    issueImage.addEventListener("change", () => {
        const file = issueImage.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.style.display = "block";
            upload_content.style.display = "none";
        };

        reader.readAsDataURL(file);
    });

    // ==========================
    // Field Validation Helpers
    // ==========================
    function setError(field, message) {
        field.error.textContent = message;
        field.error.style.display = "block";
        field.group.classList.add("has_error");
    }

    function clearError(field) {
        field.error.textContent = "";
        field.error.style.display = "none";
        field.group.classList.remove("has_error");
    }

    // clear error as soon as the user starts fixing a field
    report_name.addEventListener("input", () => clearError(nameField));
    report_type.addEventListener("change", () => clearError(typeField));
    report_description.addEventListener("input", () => clearError(descField));

    function validateForm() {
        let isValid = true;

        // Full Name - required
        if (!report_name.value.trim()) {
            setError(nameField, "Full name is required.");
            isValid = false;
        } else {
            clearError(nameField);
        }

        // Issue Type - required
        if (!report_type.value) {
            setError(typeField, "Please select an issue type.");
            isValid = false;
        } else {
            clearError(typeField);
        }

        // Description - required
        if (!report_description.value.trim()) {
            setError(descField, "Please describe the issue.");
            isValid = false;
        } else {
            clearError(descField);
        }

        // Priority is always valid (Medium pre-checked), Email is optional
        return isValid;
    }

    // ==========================
    // Close Popup
    // ==========================
    function closePopup() {
        overlay.remove();
    }

    report_close.addEventListener("click", () => {
        closePopup();
        showInfoPopup("Report closed.", "info");
    });

    cancel_report.addEventListener("click", () => {
        closePopup();
        showInfoPopup("Report cancelled.", "error");
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closePopup();
            showInfoPopup("Report closed.", "error");
        }
    });

    document.addEventListener("keydown", function esc(e) {
        if (e.key === "Escape") {
            closePopup();
            showInfoPopup("Report closed.", "error");
            document.removeEventListener("keydown", esc);
        }
    });

    // ==========================
    // Submit Report - FIXED VERSION
    // ==========================
    submit_report.addEventListener("click", async () => {
        
        if (!validateForm()) {
            return;
        }

        // Disable submit button to prevent double submission
        submit_report.disabled = true;
        submit_report.textContent = "Submitting...";

        try {
            // Upload image to Cloudinary first (if exists)
            let imageUrl = "";
            if (issueImage.files[0]) {
                showInfoPopup("Uploading image...", "info");
                imageUrl = await img_upload(issueImage.files[0]);
            }

            // Get selected priority
            const selectedPriority = popup.querySelector('input[name="priority"]:checked').value;

            // Save to Firebase with Cloudinary URL
            await addDoc(collection(db, "reports"), {
                name: report_name.value.trim(),
                email: report_email.value.trim() || "",
                issue: report_type.value,
                description: report_description.value.trim(),
                priority: selectedPriority,
                image: imageUrl,  // Cloudinary URL (empty string if no image)
                createdAt: serverTimestamp()
            });

            closePopup();
            showInfoPopup("Report submitted successfully.", "success");

        } catch (error) {
            console.error("Error submitting report:", error);
            showInfoPopup("Failed to submit report. Please try again.", "error");
            
            // Re-enable button if error occurs
            submit_report.disabled = false;
            submit_report.textContent = "Submit Report";
        }
    });
}

// ==========================
// Initialize Report Button
// ==========================
const Report_btn = document.getElementById("Report_Issue_btn2");

if (Report_btn) {
    Report_btn.addEventListener("click", Report);
}


import {
    db,
    collection,
    query,
    where,
    limit,
    getDocs
} from "./config/firebase.js";

// ==========================
// Desktop Sidebar
// ==========================
const aside = document.querySelector("aside");
const sidebarToggle = document.getElementById("sidebarToggle");

if (sidebarToggle && aside) {
    sidebarToggle.addEventListener("click", () => {
        aside.classList.toggle("close");
    });
}

// ==========================
// Mobile sidebar
// ==========================
const menuBtn = document.querySelector(".mobile_menu");

if (menuBtn && aside) {
    menuBtn.addEventListener("click", () => {
        aside.classList.toggle("open");
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

function populatePublicAsset(asset) {
    if (Asset_main_image) Asset_main_image.src = asset.image || "images/Dell.jpg";
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
        Asset_status.innerHTML = `<span class="status_dot"></span>${asset.status || "Unknown"}`;
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
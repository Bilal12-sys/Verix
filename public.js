// ===============================
// Sidebar Toggle
// ===============================
const aside = document.querySelector("aside");
const sidebarToggle = document.getElementById("sidebarToggle");

sidebarToggle.addEventListener("click", () => {
    aside.classList.toggle("collapsed");
});

// ===============================
// Grid Glow Effect
// ===============================
const glow = document.querySelector(".grid-glow");

document.addEventListener("mousemove", (e) => {
    glow.style.opacity = "1";
    glow.style.setProperty("--mx", `${e.clientX}px`);
    glow.style.setProperty("--my", `${e.clientY}px`);
});

document.addEventListener("mouseleave", () => {
    glow.style.opacity = "0";
});

// ===============================
// Sidebar Active Item
// ===============================
const menuItems = document.querySelectorAll(".items > span");

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
    });
});

// ===============================
// Tooltips When Collapsed
// ===============================
menuItems.forEach(item => {
    item.addEventListener("mouseenter", () => {
        if (aside.classList.contains("collapsed")) {
            const text = item.querySelector("p");
            item.title = text ? text.textContent : "";
        }
    });
});


const sidebarItems = document.querySelectorAll(".items > span");

sidebarItems.forEach(item => {
    item.addEventListener("click", () => {

        
        // Remove active from all items
        sidebarItems.forEach(i => {
            i.classList.remove("active");
        });

        // Add active to clicked item
        item.classList.add("active");

    });
});
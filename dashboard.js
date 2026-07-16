import { auth, signOut } from "./config/firebase.js";


function box(text, type = "info") {
    const box_parent = document.createElement("div");
    const popup = document.createElement("div");
    const inside_text = document.createElement("h3");

    box_parent.classList.add("box_p");
    popup.classList.add("pop_box", `pop_${type}`);
    inside_text.classList.add("box_text");
    inside_text.textContent = text;

    popup.appendChild(inside_text);
    box_parent.appendChild(popup);
    document.body.appendChild(box_parent);

    return box_parent;
}

function closeBox(pop, delay = 1500) {
    setTimeout(() => {
        pop.classList.add("pop_out");
        setTimeout(() => pop.remove(), 300);
    }, delay);
}


const logoutBtn = document.getElementById("logout");

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);

         const pop = box("Logout successfully", "info");
    closeBox(pop, 1200);
        // Redirect to login page
        location.href = "index.html"; 
    } catch (error) {
        console.error("Logout Error:", error);
    }
});

// Backgroun Animation
document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
});

const aside = document.querySelector('aside');
const toggle = document.getElementById('sidebarToggle');
const main = document.querySelector('.main');

// Sidbar Close
toggle.addEventListener('click', () => {
    aside.classList.toggle('collapsed');
    main.classList.toggle('aside-collapsed');
});

document.querySelectorAll('.items span').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelector('.items span.active')?.classList.remove('active');
        item.classList.add('active');
    });
});

// Numbers Animations
document.querySelectorAll('.card h2[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1000;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
});

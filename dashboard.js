import {
    auth,
    signOut,
    db,
    collection,
    getDocs
} from "./config/firebase.js";

console.log("dashboard.js loaded");


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




//chart 

const ctx = document.getElementById("assetStatus_Chart")




// Operational
const operational_Item = document.getElementById("operational_Item");
const operational_Left = document.getElementById("operational_Left");
const operational_Dot = document.getElementById("operational_Dot");
const operational_Title = document.getElementById("operational_Title");
const operational_Description = document.getElementById("operational_Description");
const operational_Right = document.getElementById("operational_Right");
const operational_Count = document.getElementById("operational_Count");
const operational_Percent = document.getElementById("operational_Percent");

// Maintenance
const maintenance_Item = document.getElementById("maintenance_Item");
const maintenance_Left = document.getElementById("maintenance_Left");
const maintenance_Dot = document.getElementById("maintenance_Dot");
const maintenance_Title = document.getElementById("maintenance_Title");
const maintenance_Description = document.getElementById("maintenance_Description");
const maintenance_Right = document.getElementById("maintenance_Right");
const maintenance_Count = document.getElementById("maintenance_Count");
const maintenance_Percent = document.getElementById("maintenance_Percent");

// Out of Service
const broken_Item = document.getElementById("broken_Item");
const broken_Left = document.getElementById("broken_Left");
const broken_Dot = document.getElementById("broken_Dot");
const broken_Title = document.getElementById("broken_Title");
const broken_Description = document.getElementById("broken_Description");
const broken_Right = document.getElementById("broken_Right");
const broken_Count = document.getElementById("broken_Count");
const broken_Percent = document.getElementById("broken_Percent");

// cards

const total_Assets = document.getElementById("total_Assets");
const open_Issues = document.getElementById("open_Issues");
const total_Technicians = document.getElementById("total_Technicians");
const resolved_Issues = document.getElementById("resolved_Issues");


function animateNumber(element, target) {

    const duration = 1000;
    const start = performance.now();

    function tick(now) {

        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        element.textContent = Math.round(eased * target);

        if (progress < 1) {
            requestAnimationFrame(tick);
        }

    }

    requestAnimationFrame(tick);

}


let statusData = [0, 0, 0];
let total = 0;
const centerTextPlugin = {
    id: "centerText",
    beforeDraw(chart) {

        const { ctx, chartArea: { top, left, width, height } } = chart;

        ctx.save();

        const centerX = left + width / 2;
        const centerY = top + height / 2;

        const totalAssets = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "700 20px Inter, sans-serif";
        ctx.fillStyle = "#1E293B";
        ctx.fillText(totalAssets, centerX, centerY - 6);

        ctx.font = "600 9px Inter, sans-serif";
        ctx.fillStyle = "#64748B";
        ctx.fillText("ASSETS", centerX, centerY + 10);

        ctx.restore();

    }
};

const chart = new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: ["Operational", "Maintenance", "Out of Service"],
        datasets: [{
            data: statusData,
            backgroundColor: [
                "#22C55E",
                "#F59E0B",
                "#EF4444"
            ],
            hoverBackgroundColor: [
                "#16A34A",
                "#D97706",
                "#DC2626"
            ],
            borderWidth: 3,
            borderColor: "#F3F7FF",
            borderRadius: 6,
            spacing: 3,
            hoverOffset: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "72%",
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 900,
            easing: "easeOutCubic"
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: "#1E293B",
                titleFont: { size: 12, weight: "600" },
                bodyFont: { size: 12, weight: "600" },
                padding: 10,
                cornerRadius: 8,
                displayColors: true,
                boxPadding: 4,
                callbacks: {
                    label: (context) => {
                        const value = context.raw;
                        const pct = ((value / total) * 100).toFixed(0);
                        return ` ${context.label}: ${value} (${pct}%)`;
                    }
                }
            }
        }
    },
    plugins: [centerTextPlugin]
});

async function loadAnalytics() {

    try {

        const snapshot = await getDocs(collection(db, "assets"));

        let operational = 0;
        let maintenance = 0;
        let broken = 0;

        snapshot.forEach((doc) => {

            const asset = doc.data();

            switch (asset.status) {

                case "Working":
                    operational++;
                    break;

                case "Maintenance":
                    maintenance++;
                    break;

                case "Broken":
                    broken++;
                    break;

            }

        });

        const total = operational + maintenance + broken;
        total_Assets.textContent = total;

        async function totalT() {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));

                let tec = 0;
                querySnapshot.forEach((doc) => {
                    const user = doc.data()

                    if (user.role === "Technician") {
                        tec++;
                    }


                total_Technicians.textContent = tec;

                });
            } catch (error) {
                const pop = box(error, "error");
        closeBox(pop, 1200);
            }
        }

        totalT()

        operational_Count.textContent = operational;
        maintenance_Count.textContent = maintenance;
        broken_Count.textContent = broken;

        operational_Percent.textContent =
            total ? Math.round((operational / total) * 100) + "%" : "0%";

        maintenance_Percent.textContent =
            total ? Math.round((maintenance / total) * 100) + "%" : "0%";

        broken_Percent.textContent =
            total ? Math.round((broken / total) * 100) + "%" : "0%";

        chart.data.datasets[0].data = [
            operational,
            maintenance,
            broken
        ];

        chart.update();

    }

    catch (error) {

        console.error(error);

    }

}
loadAnalytics();
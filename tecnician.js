// ============================
// GRID GLOW MOUSE EFFECT
// ============================
document.body.addEventListener('mousemove', (e) => {
    document.body.style.setProperty('--mx', e.clientX + 'px');
    document.body.style.setProperty('--my', e.clientY + 'px');
});


// ============================
// SIDEBAR TOGGLE LOGIC
// ============================
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}


// ============================
// CHART.JS REPAIR OVERVIEW
// ============================
const ctx = document.getElementById('repairStatus_Chart');

if (ctx) {
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'In Progress', 'Completed'],
            datasets: [{
                label: 'Repair Status',
                data: [12, 4, 38], // Matches your card data
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)',  // Pending (Warning)
                    'rgba(65, 105, 225, 0.8)',   // In Progress (Primary)
                    'rgba(34, 197, 94, 0.8)'     // Completed (Success)
                ],
                borderColor: [
                    'rgba(245, 158, 11, 1)',
                    'rgba(65, 105, 225, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 1,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    display: false // We use the custom status_list instead
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 12,
                    cornerRadius: 8,
                    boxPadding: 6
                }
            }
        }
    });
}
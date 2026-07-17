const attendanceChart = document.getElementById(
    'attendanceChart'
);

const monthlyPresent = JSON.parse(
    document.getElementById(
        "monthly-present"
    ).textContent
);

const monthlyAbsent = JSON.parse(
    document.getElementById(
        "monthly-absent"
    ).textContent
);

const monthlyLate = JSON.parse(
    document.getElementById(
        "monthly-late"
    ).textContent
);

const batchLabels = JSON.parse(
    document.getElementById(
        "batch-labels"
    ).textContent
);

const batchCounts = JSON.parse(
    document.getElementById(
        "batch-counts"
    ).textContent
);

const presentList = JSON.parse(
    document.getElementById(
        "batch-present-list"
    ).textContent
);

const absentList = JSON.parse(
    document.getElementById(
        "batch-absent-list"
    ).textContent
);

const lateList = JSON.parse(
    document.getElementById(
        "batch-late-list"
    ).textContent
);

const percentageList = JSON.parse(
    document.getElementById(
        "batch-percentage-list"
    ).textContent
);

const latestMonth = JSON.parse(
    document.getElementById(
        "latest-month"
    ).textContent
);

new Chart(
    attendanceChart,
    {
        type: 'bar',

        data: {

            labels: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec'
            ],

            datasets: [

                {
                    label: 'Present',

                    data: monthlyPresent,

                    backgroundColor: '#22c55e',

                    borderRadius: 8,

                    barThickness: 18

                },

                {
                    label: 'Absent',

                    data: monthlyAbsent,

                    backgroundColor: '#ef4444',

                    borderRadius: 8,

                    barThickness: 18

                },

                {
                    label: 'Late',

                    data: monthlyLate,

                    backgroundColor: '#f59e0b',

                    borderRadius: 8,

                    barThickness: 18

                }

            ]

        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: 'index',
                intersect: false
            },

            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }

            }

        }

    }
);

const batchChart = document.getElementById(
    'batchChart'
);

const colorPalette = [
    '#22c55e',
    '#2563eb',
    '#f59e0b',
    '#7c3aed',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
    '#84cc16',
    '#f97316'
];

const colors = [
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#9333ea',
    '#ea580c',
    '#0891b2',
    '#ca8a04',
    '#be123c',
    '#22c55e',
    '#f59e0b'
];

const chartColors = batchLabels.map(
    (_, index) => colors[index % colors.length]
);

if (batchChart) {
    new Chart(
        batchChart,
        {
            type: 'doughnut',

            data: {

                labels: batchLabels,

                datasets: [{

                    data: batchCounts,

                    backgroundColor: chartColors,

                    borderWidth: 0

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: '70%',

                plugins: {

                    legend: {
                        position: 'right'
                    },

                    tooltip: {
                        displayColors: false,

                        callbacks: {

                            title: function (context) {

                                return batchLabels[
                                    context[0].dataIndex
                                ];

                            },

                            label: function (context) {

                                let index =
                                    context.dataIndex;

                                return [

                                    "🟩 Present : " +
                                    presentList[index],

                                    "🟥 Absent : " +
                                    absentList[index],

                                    "🟨 Late : " +
                                    lateList[index],

                                    "📊 Attendance : " +
                                    (percentageList[index] || 0) + "%"

                                ];

                            }

                        }

                    }

                }

            }

        }
    );
}


const batchPerformanceLabels = JSON.parse(
    document.getElementById(
        "batch-performance-labels"
    ).textContent
);

const batchPerformanceCounts = JSON.parse(
    document.getElementById(
        "batch-performance-counts"
    ).textContent
);

const batchPerformanceChart =
    document.getElementById(
        "batchPerformanceChart"
    );

new Chart(
    batchPerformanceChart,
    {
        type: "bar",

        data: {

            labels:
                batchPerformanceLabels,

            datasets: [

                {
                    label:
                        "Attendance %",

                    data:
                        batchPerformanceCounts,

                    backgroundColor:
                        "#2563eb",

                    borderRadius: 8
                }
            ]
        },

        options: {

            indexAxis: "y",

            responsive: true,

            maintainAspectRatio: false,

            scales: {

                x: {

                    beginAtZero: true,

                    max: 100
                }
            }
        }
    }
);
// filters

function applyFilters() {

    let visibleCount = 0;

    const totalCount =
        document.querySelectorAll(
            ".report-row"
        ).length;

    const name =
        document.getElementById(
            "studentNameFilter"
        ).value.toLowerCase().trim();

    const course =
        document.getElementById(
            "courseFilter"
        ).value.toLowerCase().trim();

    const batch =
        document.getElementById(
            "batchFilter"
        ).value.toLowerCase().trim();


    const status =
        document.getElementById(
            "statusFilter"
        ).value.toLowerCase().trim();
    const student_name =
        document.getElementById(
            "studentNameFilter"
        ).value;



    const attendance =
        document.getElementById(
            "attendanceFilter"
        ).value.trim();

    document.querySelectorAll(
        ".report-row"
    ).forEach(row => {

        const studentName =
            row.dataset.name.toLowerCase();

        const studentCourse =
            row.dataset.course.toLowerCase();

        const studentStatus =
            row.dataset.status.toLowerCase();

        const studentAttendance =
            parseFloat(
                row.dataset.attendance
            );

        let attendanceMatch = true;

        if (attendance !== "") {

            attendanceMatch =
                Math.floor(studentAttendance) ===
                parseInt(attendance);

        }

        const show =

            (name === "" ||
                studentName.startsWith(name))

            &&


            (course === "" ||
                studentCourse === course)

            &&

            (batch === "" ||
                row.dataset.batch === batch)

            &&

            (status === "" ||
                studentStatus === status)

            &&

            attendanceMatch;

        row.style.display =
            show ? "" : "none";

        if (show) {

            visibleCount++;

        }

    });
    if (visibleCount === 0) {

        document.getElementById(
            "noResultsMessage"
        ).style.display = "block";

    } else {

        document.getElementById(
            "noResultsMessage"
        ).style.display = "none";

    }

    // document.getElementById("resultsCount").textContent = `Showing ${visibleCount} of ${totalCount} Students`;

}

/* document.querySelectorAll(
     ".filter-input,.filter-select"
 ).forEach(input => {
 
     input.addEventListener(
         "keyup",
         applyFilters
     );
 
     input.addEventListener(
         "change",
         applyFilters
     );
 
 });*/

document.getElementById(
    "clearFilters"
).addEventListener(
    "click",
    function () {

        window.location.href =
            "/api/reports/";

    }
);
/* Select all btn */
document.getElementById(
    "showAllBtn"
).addEventListener(
    "click",
    function () {

        const course =
            document.getElementById(
                "courseFilter"
            ).value;

        const batch =
            document.getElementById(
                "batchFilter"
            ).value;

        const status =
            document.getElementById(
                "statusFilter"
            ).value;

        const student_name =
            document.getElementById(
                "studentNameFilter"
            ).value;

        const attendance =
            document.getElementById(
                "attendanceFilter"
            ).value;

        window.location.href =
            `?student_name=${student_name}&course=${course}&batch=${batch}&status=${status}&attendance=${attendance}`;

    }
);
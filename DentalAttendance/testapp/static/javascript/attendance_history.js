document.addEventListener('DOMContentLoaded', function() {
    // サーバーから渡された年月を使用
    let currentYear = parseInt(document.getElementById('currentMonth').textContent.match(/\d+/g)[0]);
    let currentMonth = parseInt(document.getElementById('currentMonth').textContent.match(/\d+/g)[1]) - 1;

    // 月の表示を更新
    function updateMonthDisplay() {
        const monthDisplay = document.getElementById('currentMonth');
        monthDisplay.textContent = `${currentYear}年${currentMonth + 1}月`;
    }

    // 日付範囲を取得（21日から翌月20日まで）
    function getDateRange() {
        const startDate = new Date(currentYear, currentMonth, 21);
        const endDate = new Date(currentYear, currentMonth + 1, 20);
        const dates = [];
        
        let current = new Date(startDate);
        while (current <= endDate) {
            dates.push({
                date: current.getDate(),
                day: ['月', '火', '水', '木', '金', '土', '日'][current.getDay()]
            });
            current.setDate(current.getDate() + 1);
        }
        
        return dates;
    }

    // テーブルのヘッダーを生成
    function generateTableHeader() {
        const thead = document.querySelector('#attendanceTable thead tr');
        const dates = getDateRange();
        
        // 既存のヘッダーをクリア（従業員名列は残す）
        while (thead.children.length > 1) {
            thead.removeChild(thead.lastChild);
        }
        
        dates.forEach(date => {
            const th = document.createElement('th');
            th.innerHTML = `${date.date}<br>${date.day}`;
            thead.appendChild(th);
        });
    }

    // 従業員の勤怠データを取得
    function fetchAttendanceData() {
        return fetch(`/get_attendance_history?year=${currentYear}&month=${currentMonth + 1}`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching attendance data:', error);
                return [];
            });
    }

    // テーブルのボディを生成
    function generateTableBody() {
        const tbody = document.querySelector('#attendanceTable tbody');
        tbody.innerHTML = '';
        
        fetchAttendanceData().then(attendanceData => {
            attendanceData.forEach(employee => {
                const tr = document.createElement('tr');
                
                // 従業員名列
                const nameTd = document.createElement('td');
                nameTd.textContent = employee.name;
                nameTd.style.fontWeight = 'bold';
                tr.appendChild(nameTd);
                
                // 各日の勤怠データ
                const dates = getDateRange();
                dates.forEach(date => {
                    const td = document.createElement('td');
                    const dayData = employee.attendance[`${date.date}`];
                    
                    if (dayData) {
                        if (employee.employment_type === 'PT') {
                            td.innerHTML = `
                                <span class="attendance-time">${dayData.arrive || ''}</span>
                                <span class="attendance-time">${dayData.out || ''}</span>
                                <span class="attendance-time">${dayData.back || ''}</span>
                                <span class="attendance-time">${dayData.leave || ''}</span>
                            `;
                        } else {
                            td.innerHTML = `
                                <span class="attendance-time">${dayData.arrive || ''}</span>
                                <span class="attendance-time">${dayData.leave || ''}</span>
                            `;
                        }
                    } else {
                        if (employee.employment_type === 'PT') {
                            td.innerHTML = `
                                <span class="attendance-time"></span>
                                <span class="attendance-time"></span>
                                <span class="attendance-time"></span>
                                <span class="attendance-time"></span>
                            `;
                        } else {
                            td.innerHTML = `
                                <span class="attendance-time"></span>
                                <span class="attendance-time"></span>
                            `;
                        }
                    }
                    
                    tr.appendChild(td);
                });
                
                tbody.appendChild(tr);
            });
        });
    }

    // 前月ボタンのイベントリスナー
    document.getElementById('prevMonth').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateMonthDisplay();
        generateTableHeader();
        generateTableBody();
    });

    // 次月ボタンのイベントリスナー
    document.getElementById('nextMonth').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateMonthDisplay();
        generateTableHeader();
        generateTableBody();
    });

    // PDFダウンロードボタンのイベントリスナー
    document.getElementById('downloadPdf').addEventListener('click', function() {
        window.location.href = `/download_attendance_pdf?year=${currentYear}&month=${currentMonth + 1}`;
    });

    // 初期表示
    generateTableHeader();
    generateTableBody();
});
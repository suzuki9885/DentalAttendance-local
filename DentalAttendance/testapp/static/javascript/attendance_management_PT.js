function showModal(actionType) {
    // ボタンの状態を確認
    fetch('/record_attendance_PT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action_type=${actionType}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'confirm') {
            document.getElementById('modalMessage').textContent = `${actionType}を記録しますか？`;
            document.getElementById('modalActionType').value = actionType;
            document.getElementById('confirmationModal').style.display = 'flex';
        } else if (data.status === 'invalid') {
            showErrorModal(actionType);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('エラーが発生しました。もう一度お試しください。');
    });
}

function showErrorModal(actionType) {
    const modal = document.getElementById('errorModal');
    const message = document.getElementById('errorMessage');
    
    switch(actionType) {
        case '出勤':
            message.textContent = 'すでに出勤済みです';
            break;
        case '退勤':
            message.textContent = 'すでに退勤済みです';
            break;
        case '外出':
            message.textContent = 'すでに外出済みです';
            break;
        case '戻り':
            message.textContent = 'すでに戻り済みです';
            break;
    }

    modal.style.display = 'flex';
    setTimeout(() => {
        closeErrorModal();
    }, 3000);
}

function closeErrorModal() {
    document.getElementById('errorModal').style.display = 'none';
}

function closeModal() {
    document.getElementById('confirmationModal').style.display = 'none';
}

function showCompletionModal(actionType) {
    const modal = document.getElementById('completionModal');
    const title = document.getElementById('completionTitle');
    const message = document.getElementById('completionMessage');

    switch(actionType) {
        case '出勤':
            title.textContent = '出勤完了';
            message.textContent = '今日も1日頑張りましょう！';
            break;
        case '退勤':
            title.textContent = '退勤完了';
            message.textContent = '今日も1日お疲れ様でした！';
            break;
        case '外出':
            title.textContent = '外出完了';
            message.textContent = '行ってらっしゃい！';
            break;
        case '戻り':
            title.textContent = '戻り完了';
            message.textContent = 'おかえりなさい！';
            break;
    }

    modal.style.display = 'flex';
    setTimeout(() => {
        closeCompletionModal();
    }, 3000);
}

function closeCompletionModal() {
    document.getElementById('completionModal').style.display = 'none';
}

document.getElementById('confirmForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const actionType = document.getElementById('modalActionType').value;
    
    fetch('/confirm_attendance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action_type=${actionType}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            closeModal();
            showCompletionModal(actionType);
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } else if (data.status === 'error') {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('エラーが発生しました。もう一度お試しください。');
    });
});

// メニューを開く
document.querySelector('.detail-button').addEventListener('click', function() {
    document.querySelector('.navigation-menu').classList.add('active');
    fetchRecords();
});

// メニューを閉じる
document.querySelector('.close-menu').addEventListener('click', function() {
    document.querySelector('.navigation-menu').classList.remove('active');
});

// 今日の記録を取得して表示
function fetchRecords() {
    fetch('/get_todays_records')
        .then(response => response.json())
        .then(records => {
            const recordsList = document.getElementById('attendance-records');
            recordsList.innerHTML = '';
            
            if (records.length === 0) {
                recordsList.innerHTML = '<li>今日の記録なし</li>';
                return;
            }

            records.forEach(record => {
                const li = document.createElement('li');
                li.textContent = `　${record.action_type}　　${record.time}`;
                recordsList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const recordsList = document.getElementById('attendance-records');
            recordsList.innerHTML = '<li>記録の取得に失敗しました</li>';
        });
}

document.addEventListener('DOMContentLoaded', function() {
    const correctionRequestButton = document.querySelector('.correction-request-button');
    const correctionRequestModal = document.getElementById('correctionRequestModal');
    if (!correctionRequestButton || !correctionRequestModal) {
        return;
    }

    const correctionRequestClose = document.getElementById('correctionRequestClose');
    const correctionRequestForm = document.getElementById('correctionRequestForm');
    const correctionRequestFeedback = document.getElementById('correctionRequestFeedback');
    const correctionRequestDateDisplay = document.getElementById('correctionRequestDisplayDate');
    const correctionRequestDateInput = document.getElementById('correctionRequestDateInput');
    const correctionRequestTime = document.getElementById('correctionRequestTime');
    const correctionRequestType = document.getElementById('correctionRequestType');
    const correctionRequestReason = document.getElementById('correctionRequestReason');
    const timePickerContainer = document.getElementById('correctionRequestTimePicker');
    const hourWheel = timePickerContainer ? timePickerContainer.querySelector('.time-wheel[data-type="hour"]') : null;
    const minuteWheel = timePickerContainer ? timePickerContainer.querySelector('.time-wheel[data-type="minute"]') : null;
    const weekLabels = ['日', '月', '火', '水', '木', '金', '土'];

    const pad = (value) => value.toString().padStart(2, '0');

    const TIME_ITEM_HEIGHT = 44;
    let wheelsInitialized = false;

    const updateHiddenTimeValue = () => {
        if (!hourWheel || !minuteWheel) {
            return;
        }
        const hour = hourWheel.dataset.value || '00';
        const minute = minuteWheel.dataset.value || '00';
        correctionRequestTime.value = `${hour}:${minute}`;
    };

    const setWheelSelection = (wheel, index) => {
        const items = wheel.querySelectorAll('.time-wheel-item');
        items.forEach((item, idx) => {
            const isActive = idx === index;
            item.classList.toggle('active', isActive);
            if (isActive) {
                wheel.dataset.value = item.dataset.value;
            }
        });
    };

    const snapToIndex = (wheel, limit, index, animate = false) => {
        const boundedIndex = Math.max(0, Math.min(limit - 1, index));
        const top = boundedIndex * TIME_ITEM_HEIGHT;
        if (animate) {
            wheel.scrollTo({ top, behavior: 'smooth' });
        } else {
            wheel.scrollTop = top;
        }
        setWheelSelection(wheel, boundedIndex);
        updateHiddenTimeValue();
    };

    const indexFromScroll = (wheel) => Math.round(wheel.scrollTop / TIME_ITEM_HEIGHT);

    const attachWheelEvents = (wheel, limit) => {
        const handleScrollEnd = () => {
            snapToIndex(wheel, limit, indexFromScroll(wheel), true);
        };

        let scrollTimeout = null;
        wheel.addEventListener('scroll', () => {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(handleScrollEnd, 80);
        });

        ['touchend', 'mouseup', 'mouseleave'].forEach(evt => {
            wheel.addEventListener(evt, handleScrollEnd);
        });

        wheel.addEventListener('click', (event) => {
            const item = event.target.closest('.time-wheel-item');
            if (!item) return;
            const idx = Number(item.dataset.index);
            snapToIndex(wheel, limit, idx, true);
        });
    };

    const buildWheel = (wheel, limit) => {
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'time-wheel-items';
        for (let i = 0; i < limit; i += 1) {
            const item = document.createElement('div');
            item.className = 'time-wheel-item';
            item.dataset.index = String(i);
            item.dataset.value = pad(i);
            item.textContent = pad(i);
            itemsContainer.appendChild(item);
        }
        wheel.appendChild(itemsContainer);
        wheel.dataset.value = '00';
    };

    const getIndexForValue = (wheel, value) => {
        const items = wheel.querySelectorAll('.time-wheel-item');
        const index = Array.from(items).findIndex(item => item.dataset.value === value);
        return index >= 0 ? index : 0;
    };

    const setWheelPosition = (hourValue, minuteValue, animate = false) => {
        if (!wheelsInitialized) return;
        snapToIndex(hourWheel, 24, getIndexForValue(hourWheel, hourValue), animate);
        snapToIndex(minuteWheel, 60, getIndexForValue(minuteWheel, minuteValue), animate);
    };

    const initializeTimePicker = () => {
    if (!timePickerContainer || !hourWheel || !minuteWheel || wheelsInitialized) {
            return;
        }

        buildWheel(hourWheel, 24);
        buildWheel(minuteWheel, 60);
        attachWheelEvents(hourWheel, 24);
        attachWheelEvents(minuteWheel, 60);
        setWheelSelection(hourWheel, 0);
        setWheelSelection(minuteWheel, 0);
        updateHiddenTimeValue();
        wheelsInitialized = true;
    };

    const updateModalDateTime = () => {
        const now = new Date();
        correctionRequestDateDisplay.textContent = `日時：${now.getFullYear()}年${pad(now.getMonth() + 1)}月${pad(now.getDate())}日(${weekLabels[now.getDay()]})`;
        correctionRequestDateInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        initializeTimePicker();
        setWheelPosition('00', '00', false);
        updateHiddenTimeValue();
    };

    const resetFeedback = () => {
        correctionRequestFeedback.textContent = '';
        correctionRequestFeedback.classList.remove('error', 'success');
    };

    if (correctionRequestReason) {
        correctionRequestReason.addEventListener('change', () => {
            const selected = correctionRequestReason.options[correctionRequestReason.selectedIndex];
            if (selected && selected.value) {
                selected.textContent = selected.value;
            }
        });
    }

    const openCorrectionRequestModal = () => {
        correctionRequestForm.reset();
        resetFeedback();
        updateModalDateTime();
        correctionRequestModal.classList.add('active');
    };

    const closeCorrectionRequestModal = () => {
        correctionRequestModal.classList.remove('active');
        correctionRequestForm.reset();
        setWheelPosition('00', '00', false);
        updateHiddenTimeValue();
    };

    correctionRequestButton.addEventListener('click', openCorrectionRequestModal);
    correctionRequestClose.addEventListener('click', closeCorrectionRequestModal);
    correctionRequestForm.addEventListener('submit', function(event) {
        event.preventDefault();
        resetFeedback();

        if (!correctionRequestType.value) {
            correctionRequestFeedback.textContent = '打刻種別を選択してください。';
            correctionRequestFeedback.classList.add('error');
            return;
        }

        if (!correctionRequestReason.value) {
            correctionRequestFeedback.textContent = '理由を選択してください。';
            correctionRequestFeedback.classList.add('error');
            return;
        }

        const formData = new FormData(correctionRequestForm);
        correctionRequestFeedback.textContent = '送信中...';

        fetch('/miss_punch_report', {
            method: 'POST',
            body: new URLSearchParams(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    correctionRequestFeedback.textContent = '報告が送信されました。';
                    correctionRequestFeedback.classList.add('success');
                    setTimeout(() => {
                        closeCorrectionRequestModal();
                    }, 1200);
                } else {
                    correctionRequestFeedback.textContent = data.message || '報告に失敗しました。';
                    correctionRequestFeedback.classList.add('error');
                }
            })
            .catch(() => {
                correctionRequestFeedback.textContent = '通信エラーが発生しました。';
                correctionRequestFeedback.classList.add('error');
            });
    });
});
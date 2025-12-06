document.addEventListener('DOMContentLoaded', () => {
    const notificationButton = document.getElementById('notificationButton');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationModal = document.getElementById('notificationModal');
    const notificationList = document.getElementById('notificationList');
    const notificationEmpty = document.getElementById('notificationEmpty');
    const notificationClose = document.getElementById('notificationClose');

    if (!notificationButton || !notificationModal) {
        return;
    }

    const formatDate = (value) => {
        if (!value) {
            return '';
        }
        const [year, month, day] = value.split('-').map((part) => Number(part));
        return `${year}年${month}月${day}日`;
    };

    const formatTime = (value) => {
        if (!value) {
            return '--:--';
        }
        const [hour, minute] = value.split(':');
        return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    };

    const updateBadge = (count) => {
        if (!notificationBadge) {
            return;
        }
        if (count > 0) {
            notificationBadge.hidden = false;
            notificationBadge.textContent = count > 99 ? '99+' : String(count);
        } else {
            notificationBadge.hidden = true;
            notificationBadge.textContent = '';
        }
    };

    const renderNotifications = (reports) => {
        notificationList.innerHTML = '';
        notificationEmpty.textContent = '新しい報告はありません。';

        if (!reports.length) {
            notificationEmpty.hidden = false;
            return;
        }

        notificationEmpty.hidden = true;

        reports.forEach((report) => {
            const item = document.createElement('li');
            item.className = 'notification-item';
            if (!report.is_read) {
                item.classList.add('unread');
            }

            const header = document.createElement('div');
            header.className = 'notification-item-header';

            const user = document.createElement('span');
            user.className = 'notification-user';
            user.textContent = report.employee_name || '不明な従業員';

            const reasonBadge = document.createElement('span');
            reasonBadge.className = 'notification-reason-badge';
            reasonBadge.textContent = report.reason || '理由未入力';

            header.appendChild(user);
            header.appendChild(reasonBadge);

            const details = document.createElement('div');
            details.className = 'notification-details';

            const action = document.createElement('div');
            action.className = 'notification-action';
            action.textContent = `${formatDate(report.report_date)} ${formatTime(report.report_time)} ｜ ${report.action_type}`;

            const actions = document.createElement('div');
            actions.className = 'notification-actions';

            const applyButton = document.createElement('button');
            applyButton.className = 'notification-apply-button';
            applyButton.type = 'button';
            applyButton.textContent = report.is_applied ? '適用済み' : '適用';
            applyButton.disabled = !!report.is_applied;

            if (report.is_applied) {
                item.classList.add('applied');
            } else {
                applyButton.addEventListener('click', async () => {
                    applyButton.disabled = true;
                    applyButton.textContent = '適用中...';
                    try {
                        const response = await fetch(`/miss_punch_notifications/apply/${report.id}`, {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json'
                            }
                        });

                        const result = await response.json();
                        if (!response.ok || result.status !== 'success') {
                            throw new Error(result.message || '適用に失敗しました。');
                        }

                        applyButton.textContent = '適用済み';
                        item.classList.add('applied');
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    } catch (error) {
                        console.error(error);
                        applyButton.disabled = false;
                        applyButton.textContent = '適用';
                        alert(error.message || '適用処理でエラーが発生しました。');
                    }
                });
            }

            actions.appendChild(applyButton);

            details.appendChild(action);
            details.appendChild(actions);

            item.appendChild(header);
            item.appendChild(details);
            notificationList.appendChild(item);
        });
    };

    const fetchNotifications = async () => {
        const response = await fetch('/miss_punch_notifications', {
            headers: { 'Accept': 'application/json' }
        });

        if (response.status === 401) {
            throw new Error('管理者としてログインしてください。');
        }

        if (!response.ok) {
            throw new Error('通知の取得に失敗しました。');
        }

        return response.json();
    };

    const markAllAsRead = async (ids) => {
        if (!ids || !ids.length) {
            return;
        }
        const response = await fetch('/miss_punch_notifications/mark_read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ ids })
        });

        if (!response.ok) {
            throw new Error('通知の更新に失敗しました。');
        }
    };

    const openModal = () => {
        notificationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        notificationModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    notificationButton.addEventListener('click', async () => {
        notificationButton.disabled = true;
        try {
            const data = await fetchNotifications();
            renderNotifications(data.reports);
            openModal();

            const unreadIds = data.reports.filter((report) => !report.is_read).map((report) => report.id);
            if (unreadIds.length) {
                await markAllAsRead(unreadIds);
                notificationList.querySelectorAll('.notification-item.unread').forEach((item) => {
                    item.classList.remove('unread');
                });
            }
            const unappliedDesktop = data.reports.filter((report) => !report.is_applied).length;
            updateBadge(unappliedDesktop);
        } catch (error) {
            console.error(error);
            notificationList.innerHTML = '';
            notificationEmpty.hidden = false;
            notificationEmpty.textContent = error.message;
            openModal();
        } finally {
            notificationButton.disabled = false;
        }
    });

    notificationClose.addEventListener('click', closeModal);
    notificationModal.addEventListener('click', (event) => {
        if (event.target === notificationModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && notificationModal.classList.contains('active')) {
            closeModal();
        }
    });

    (async () => {
        try {
            const data = await fetchNotifications();
            const unapplied = data.reports.filter((report) => !report.is_applied).length;
            updateBadge(unapplied);
        } catch (error) {
            console.error(error);
        }
    })();
});

